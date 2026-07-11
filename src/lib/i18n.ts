import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'WorkGuard',
      dashboard: 'Dashboard',
      shifts: 'Shifts',
      roster: 'Roster',
      calendar: 'Calendar',
      analytics: 'Analytics',
      reports: 'Reports',
      settings: 'Settings',
      compliant: 'Compliant',
      warning: 'Warning',
      violation: 'Violation',
      hoursRemaining: '{{count}} hours remaining',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      email: 'Email',
      password: 'Password',
      fullName: 'Full Name',
      forgotPassword: 'Forgot Password?',
      continueWithGoogle: 'Continue with Google',
      legalDisclaimer: 'Legal Disclaimer',
      acknowledge: 'I understand and acknowledge',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      duplicate: 'Duplicate',
      export: 'Export',
      import: 'Import',
      offline: 'Offline',
      online: 'Online',
    },
  },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
