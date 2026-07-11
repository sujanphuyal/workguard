import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Menu, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { DateField } from '@/components/DateField';
import { KeyboardAwareScrollView, ScreenContainer } from '@/components';
import { AUSTRALIAN_TIMEZONES, COURSE_TYPE_OPTIONS } from '@/features/settings/constants';
import { saveProfile } from '@/features/settings/services/profileService';
import { useAuthStore } from '@/store';
import type { CourseType } from '@/types';

export default function EditProfileScreen() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [university, setUniversity] = useState(profile?.university ?? '');
  const [courseName, setCourseName] = useState(profile?.courseName ?? '');
  const [courseType, setCourseType] = useState<CourseType>(profile?.courseType ?? 'bachelors');
  const [courseCommencementDate, setCourseCommencementDate] = useState(
    profile?.courseCommencementDate ?? new Date(),
  );
  const [hasCommencementDate, setHasCommencementDate] = useState(
    Boolean(profile?.courseCommencementDate),
  );
  const [visaExpiry, setVisaExpiry] = useState(profile?.visaExpiry ?? new Date());
  const [hasVisaExpiry, setHasVisaExpiry] = useState(Boolean(profile?.visaExpiry));
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'Australia/Sydney');
  const [timezoneMenuOpen, setTimezoneMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) {
    return (
      <ScreenContainer>
        <Text>Profile not loaded.</Text>
      </ScreenContainer>
    );
  }

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await saveProfile(profile, {
        fullName: fullName.trim(),
        university: university.trim() || undefined,
        courseName: courseName.trim() || undefined,
        courseType,
        courseCommencementDate: hasCommencementDate ? courseCommencementDate : null,
        visaExpiry: hasVisaExpiry ? visaExpiry : null,
        timezone,
      });
      setProfile(updated);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAwareScrollView includeHeaderOffset contentContainerStyle={styles.container}>
        <TextInput label="Full name" value={fullName} onChangeText={setFullName} style={styles.field} />
        <TextInput
          label="Email"
          value={profile.email}
          disabled
          style={styles.field}
        />
        <TextInput
          label="University"
          value={university}
          onChangeText={setUniversity}
          style={styles.field}
        />
        <TextInput
          label="Course name"
          value={courseName}
          onChangeText={setCourseName}
          style={styles.field}
        />

        <Text variant="labelMedium" style={styles.label}>
          Course type
        </Text>
        <SegmentedButtons
          value={courseType}
          onValueChange={(v) => setCourseType(v as CourseType)}
          buttons={COURSE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label.split(' ')[0]! }))}
          style={styles.field}
        />

        <Text variant="labelMedium" style={styles.label}>
          Course commencement date
        </Text>
        <SegmentedButtons
          value={hasCommencementDate ? 'set' : 'unset'}
          onValueChange={(v) => setHasCommencementDate(v === 'set')}
          buttons={[
            { value: 'unset', label: 'Not set' },
            { value: 'set', label: 'Set date' },
          ]}
          style={styles.field}
        />
        {hasCommencementDate && (
          <DateField
            label="Commencement date"
            value={courseCommencementDate}
            onChange={setCourseCommencementDate}
          />
        )}

        <Text variant="labelMedium" style={styles.label}>
          Visa expiry
        </Text>
        <SegmentedButtons
          value={hasVisaExpiry ? 'set' : 'unset'}
          onValueChange={(v) => setHasVisaExpiry(v === 'set')}
          buttons={[
            { value: 'unset', label: 'Not set' },
            { value: 'set', label: 'Set date' },
          ]}
          style={styles.field}
        />
        {hasVisaExpiry && (
          <DateField label="Visa expiry date" value={visaExpiry} onChange={setVisaExpiry} />
        )}

        <Text variant="labelMedium" style={styles.label}>
          Timezone
        </Text>
        <Menu
          visible={timezoneMenuOpen}
          onDismiss={() => setTimezoneMenuOpen(false)}
          anchor={
            <Button mode="outlined" onPress={() => setTimezoneMenuOpen(true)} style={styles.field}>
              {timezone}
            </Button>
          }
        >
          {AUSTRALIAN_TIMEZONES.map((tz) => (
            <Menu.Item
              key={tz}
              title={tz}
              onPress={() => {
                setTimezone(tz);
                setTimezoneMenuOpen(false);
              }}
            />
          ))}
        </Menu>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <Button mode="contained" loading={loading} onPress={handleSave}>
            Save Profile
          </Button>
          <Button mode="text" onPress={() => router.back()}>
            Cancel
          </Button>
        </View>
      </KeyboardAwareScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 32 },
  field: { marginVertical: 6 },
  label: { marginTop: 12 },
  error: { color: '#D32F2F', marginTop: 8 },
  actions: { marginTop: 24, gap: 8 },
});
