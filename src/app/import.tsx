import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';

import { pickCsvFile } from '@/features/roster/services/csvFilePicker';
import {
  buildEmployerLookup,
  IMPORT_CSV_EXAMPLE,
  importRowToShiftInput,
  lookupEmployerId,
  parseCsv,
  previewImport,
} from '@/features/roster/services/importService';
import { shiftService } from '@/features/shifts/services/shiftService';
import { useEmployers, useShifts, useUserContext } from '@/hooks/useCompliance';
import { useUserId } from '@/hooks/useUser';
import type { AppTheme } from '@/theme';
import type { Shift } from '@/types';
import { spacing } from '@/theme/tokens';

interface ImportResult {
  imported: number;
  skippedNoEmployer: number;
  failed: number;
}

export default function ImportScreen() {
  const theme = useTheme<AppTheme>();
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pickingFile, setPickingFile] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof previewImport> | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const context = useUserContext();
  const userId = useUserId()!;
  const { data: shifts = [], refetch } = useShifts();
  const { data: employers = [] } = useEmployers();

  const employerMap = buildEmployerLookup(employers);

  const handleTextChange = (value: string) => {
    setText(value);
    setPreview(null);
    setResult(null);
    if (value !== text) {
      setFileName(null);
    }
  };

  const handlePickFile = async () => {
    setFileError(null);
    setPickingFile(true);
    try {
      const picked = await pickCsvFile();
      if (!picked) return;
      setText(picked.content);
      setFileName(picked.name);
      setPreview(null);
      setResult(null);
    } catch (e) {
      setFileError(e instanceof Error ? e.message : 'Could not read CSV file');
    } finally {
      setPickingFile(false);
    }
  };

  const handlePreview = () => {
    if (!context) return;
    setResult(null);
    const rows = parseCsv(text);
    setPreview(previewImport(rows, shifts, context, employerMap, userId));
  };

  const handleImport = () => {
    if (!context || !preview) return;
    let imported = 0;
    let skippedNoEmployer = 0;
    let failed = 0;
    // Validate each new shift against already-created ones, not just the initial list.
    const accumulated: Shift[] = [...shifts];
    for (const row of preview.rows) {
      const employerId = lookupEmployerId(employerMap, row.employer);
      if (!employerId) {
        skippedNoEmployer += 1;
        continue;
      }
      try {
        const created = shiftService.create(
          userId,
          {
            employerId,
            ...importRowToShiftInput(row),
          },
          accumulated,
          context,
        );
        accumulated.push(created);
        imported += 1;
      } catch {
        failed += 1;
      }
    }
    refetch();
    setPreview(null);
    setResult({ imported, skippedNoEmployer, failed });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button
        mode="outlined"
        icon="file-upload"
        loading={pickingFile}
        onPress={handlePickFile}
      >
        Choose CSV file
      </Button>
      {fileName ? (
        <Text variant="bodySmall" style={styles.fileName}>
          Loaded: {fileName}
        </Text>
      ) : null}
      {fileError ? (
        <Text variant="bodySmall" style={{ color: theme.colors.error }}>
          {fileError}
        </Text>
      ) : null}

      <TextInput
        label="Or paste CSV content"
        value={text}
        onChangeText={handleTextChange}
        multiline
        numberOfLines={10}
        mode="outlined"
        placeholder={IMPORT_CSV_EXAMPLE}
        style={styles.input}
      />

      <Button mode="outlined" onPress={handlePreview} disabled={!text.trim()}>
        Preview Import
      </Button>

      {preview && (
        <>
          <Text>
            Ready to import: {preview.importable} of {preview.rows.length} row
            {preview.rows.length === 1 ? '' : 's'}
          </Text>
          <Text variant="bodySmall">
            Duplicates: {preview.duplicates} | Overlaps: {preview.overlaps} | Invalid:{' '}
            {preview.invalid}
          </Text>
          {preview.unmatchedEmployers.length > 0 ? (
            <Text variant="bodySmall" style={{ color: theme.colors.error }}>
              No matching employer for: {preview.unmatchedEmployers.join(', ')}. Add these
              employers in Settings first, or fix the names in your CSV.
            </Text>
          ) : null}
          <Text>
            Compliance: {preview.complianceStatus} ({preview.projectedHours.toFixed(1)}h projected)
          </Text>
          <Button mode="contained" onPress={handleImport} disabled={preview.importable === 0}>
            Confirm Import
          </Button>
        </>
      )}

      {result && (
        <Text style={{ color: theme.colors.primary }}>
          Imported {result.imported} shift{result.imported === 1 ? '' : 's'}.
          {result.skippedNoEmployer > 0
            ? ` Skipped ${result.skippedNoEmployer} (no matching employer).`
            : ''}
          {result.failed > 0 ? ` Skipped ${result.failed} (duplicate/overlap/invalid).` : ''}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md },
  input: { minHeight: 160 },
  fileName: { opacity: 0.8 },
});
