import { useEffect } from 'react';
import { Redirect, Stack, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    window.frameworkReady?.();
  }, []);

  return (
    <>
      <Slot />
      {!isLoading && !isAuthenticated && <Redirect href="/auth" />}
      <StatusBar style="auto" />
    </>
  );
}