import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ─── Auth Hook ────────────────────────────────────────────────────────────────
// Manages Supabase Auth session for the StockMo SPA.
// Two roles: 'admin' and 'tech' — resolved from user_metadata.role.
// Admin accounts are manually provisioned. Techs self-register.

export type UserRole = 'admin' | 'tech' | null;

export interface AuthState {
  user:        User | null;
  session:     Session | null;
  role:        UserRole;
  loading:     boolean;
  techProfile: TechProfile | null;
}

export interface TechProfile {
  id:       string;
  name:     string;
  initials: string;
  role:     string;
  online:   boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user:        null,
    session:     null,
    role:        null,
    loading:     true,
    techProfile: null,
  });

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSession(session: Session | null) {
    if (!session?.user) {
      setState({ user: null, session: null, role: null, loading: false, techProfile: null });
      return;
    }

    const user = session.user;
    const role = (user.user_metadata?.role as UserRole) ?? null;

    // If tech, fetch their technician profile
    let techProfile: TechProfile | null = null;
    if (role === 'tech') {
      const { data } = await supabase
        .from('technicians')
        .select('id, name, initials, role, online')
        .eq('user_id', user.id)
        .single();
      techProfile = data ?? null;
    }

    setState({ user, session, role, loading: false, techProfile });
  }

  // ── Tech self-registration ──────────────────────────────────────────────────
  async function signUpTech(params: {
    name:            string;
    email:           string;
    password:        string;
    confirmPassword: string;
  }): Promise<{ error?: string }> {
    if (params.password !== params.confirmPassword) {
      return { error: 'Passwords do not match' };
    }
    if (params.password.length < 8) {
      return { error: 'Password must be at least 8 characters' };
    }

    const initials = params.name
      .split(' ')
      .map(w => w[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');

    // Create Supabase Auth user.
    // A DB trigger (handle_new_tech_user) auto-inserts the technicians row
    // server-side, so no manual insert is needed here.
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email:    params.email,
      password: params.password,
      options:  {
        data: { role: 'tech', name: params.name, initials },
      },
    });

    if (signUpErr) return { error: signUpErr.message };
    if (!data.user) return { error: 'Signup failed — no user returned' };

    // If session is null, email confirmation is required
    if (!data.session) {
      return { error: 'CHECK_EMAIL' };
    }

    return {};
  }

  // ── Email + password login (both roles) ────────────────────────────────────
  async function signIn(email: string, password: string): Promise<{ error?: string }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }

  // ── Sign out ───────────────────────────────────────────────────────────────
  async function signOut(): Promise<void> {
    // Mark technician as offline
    if (state.techProfile) {
      await supabase
        .from('technicians')
        .update({ online: false })
        .eq('id', state.techProfile.id);
    }
    await supabase.auth.signOut();
  }

  return { ...state, signUpTech, signIn, signOut };
}
