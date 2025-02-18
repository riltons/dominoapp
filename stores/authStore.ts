import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, phone: string) => Promise<void>;
}

const saveSession = async (session: any) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('session', JSON.stringify(session));
  } else {
    await SecureStore.setItemAsync('session', JSON.stringify(session));
  }
};

const removeSession = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('session');
  } else {
    await SecureStore.deleteItemAsync('session');
  }
};

export const useAuthStore = create<AuthState>((set) => {
  // Initialize session on store creation
  const initSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();

      set({
        isAuthenticated: !!session,
        isLoading: false,
        user: user
      });
    } catch (error) {
      console.error('Error initializing session:', error);
      set({ isLoading: false });
    }
  };

  // Call initSession immediately
  initSession();

  return {
    isAuthenticated: false,
    isLoading: true,
    user: null,

    signIn: async (email: string, password: string) => {
      try {
        if (!email || !password) {
          throw new Error('Email and password are required');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message === 'Invalid login credentials') {
            throw new Error('Email ou senha inválidos');
          }
          throw error;
        }

        if (!data.user || !data.session) {
          throw new Error('Erro ao fazer login. Tente novamente.');
        }

        set({ isAuthenticated: true, user: data.user });
        await saveSession(data.session);
      } catch (error) {
        console.error('Error signing in:', error);
        throw error;
      }
    },

    signOut: async () => {
      try {
        await supabase.auth.signOut();
        await removeSession();
        set({ isAuthenticated: false, user: null });
      } catch (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    },

    signUp: async (email: string, password: string, phone: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          phone,
        });

        if (error) throw error;

        // Create a profile record for the new user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user?.id,
            username: email.split('@')[0],
            phone_number: phone,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          throw profileError;
        }

        set({ isAuthenticated: true, user: data.user });
        await saveSession(data.session);
      } catch (error) {
        console.error('Error signing up:', error);
        throw error;
      }
    },
  };
});