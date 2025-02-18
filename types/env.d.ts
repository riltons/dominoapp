declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_TABLE_PREFIX: string;
      EXPO_PUBLIC_ENV: 'development' | 'test' | 'production';
    }
  }
}

export {};