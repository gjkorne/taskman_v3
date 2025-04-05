import React, { useEffect, useState } from 'react';
import { User, AuthError, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { AuthContext } from '../../lib/auth';
import { createLogger } from '../../utils/logging';

const logger = createLogger('AuthProvider');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  // Reset session when encountering a serious auth error
  const handleAuthError = (error: any) => {
    logger.error('Auth error encountered:', error);
    
    // Check if it's a refresh token error
    if (error?.message?.includes('Invalid Refresh Token') || 
        error?.message?.includes('Refresh Token Not Found')) {
      logger.warn('Invalid refresh token detected, forcing re-authentication');
      // Clear local storage tokens to fix broken refresh state
      localStorage.removeItem('supabase.auth.token');
      // Force sign out for a clean slate
      supabase.auth.signOut().catch(e => logger.error('Error during cleanup signout:', e));
      setUser(null);
    }
    
    setAuthError(error);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          handleAuthError(error);
        } else {
          setUser(session?.user ?? null);
        }
        setLoading(false);
      })
      .catch(error => {
        logger.error('Error getting initial session:', error);
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session) => {
        logger.log('Auth state changed:', event);
        if (event === 'SIGNED_OUT') {
          // When user signs out, clear any auth-related errors
          setAuthError(null);
        }
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        handleAuthError(error);
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        handleAuthError(error);
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signOut,
      authError
    }}>
      {children}
    </AuthContext.Provider>
  );
}