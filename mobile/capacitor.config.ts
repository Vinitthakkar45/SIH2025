import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.sih2025',
  appName: 'SIH2025',
  webDir: '../frontend/out'
  server: {
    androidScheme: 'https'
  }
};

export default config;
