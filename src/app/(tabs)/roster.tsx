import { Redirect } from 'expo-router';

/** Roster tab removed — import lives on Calendar. */
export default function RosterRedirect() {
  return <Redirect href="/(tabs)/calendar" />;
}
