import { createContext, useContext } from 'react';
import { supabase } from './supabase';
import { User, AuthError } from '@supabase/supabase-js';

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  authError: AuthError | null;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export async function checkOnboardingStatus(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('onboarding_complete')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data?.onboarding_complete ?? false;
}