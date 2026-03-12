import { type PropsWithChildren, createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { backendConfigured, devSingleUserConfig, devSingleUserMode } from "@/src/lib/env";
import { supabase } from "@/src/lib/supabase";
import { useAppStore } from "@/src/store/app-store";

type AuthContextValue = {
  ready: boolean;
  session: Session | null;
  user: User | null;
  backendConfigured: boolean;
  isPreviewMode: boolean;
  isDevSingleUserMode: boolean;
  isAuthenticated: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<{ session: Session | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const isPreviewMode = useAppStore((state) => state.previewMode);
  const disablePreviewMode = useAppStore((state) => state.disablePreviewMode);
  const [ready, setReady] = useState(!backendConfigured);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!backendConfigured) {
      return;
    }

    let cancelled = false;

    const bootstrapSession = async () => {
      console.log("[AuthProvider] bootstrap | backendConfigured:", backendConfigured, "devSingleUserMode:", devSingleUserMode);
      if (!devSingleUserMode) {
        const { data } = await supabase.auth.getSession();
        console.log("[AuthProvider] getSession | hasSession:", !!data.session, "email:", data.session?.user?.email);
        if (cancelled) {
          return;
        }
        setSession(data.session);
        setReady(true);
        return;
      }

      setReady(false);

      const existingSession = await supabase.auth.getSession();
      if (existingSession.data.session?.user.email === devSingleUserConfig.email) {
        if (cancelled) {
          return;
        }
        disablePreviewMode();
        setSession(existingSession.data.session);
        setReady(true);
        return;
      }

      if (existingSession.data.session) {
        await supabase.auth.signOut();
      }

      const signInResult = await supabase.auth.signInWithPassword({
        email: devSingleUserConfig.email,
        password: devSingleUserConfig.password,
      });

      if (!signInResult.error && signInResult.data.session) {
        if (cancelled) {
          return;
        }
        disablePreviewMode();
        setSession(signInResult.data.session);
        setReady(true);
        return;
      }

      const signUpResult = await supabase.auth.signUp({
        email: devSingleUserConfig.email,
        password: devSingleUserConfig.password,
      });

      if (
        signUpResult.error &&
        !/already registered|already been registered/i.test(signUpResult.error.message)
      ) {
        throw signUpResult.error;
      }

      if (signUpResult.data.session) {
        if (cancelled) {
          return;
        }
        disablePreviewMode();
        setSession(signUpResult.data.session);
        setReady(true);
        return;
      }

      const retrySignIn = await supabase.auth.signInWithPassword({
        email: devSingleUserConfig.email,
        password: devSingleUserConfig.password,
      });

      if (retrySignIn.error || !retrySignIn.data.session) {
        throw retrySignIn.error ?? new Error("Dev single-user sign-in failed.");
      }

      if (cancelled) {
        return;
      }
      disablePreviewMode();
      setSession(retrySignIn.data.session);
      setReady(true);
    };

    bootstrapSession().then(() => {
      console.log("[AuthProvider] bootstrap complete");
    }).catch((error) => {
      if (cancelled) {
        return;
      }
      console.error("[AuthProvider] bootstrap FAILED:", error);
      setSession(null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setReady(true);
      if (nextSession) {
        disablePreviewMode();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [disablePreviewMode]);

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
  };

  const signUpWithPassword = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      throw error;
    }
    return { session: data.session };
  };

  const signOut = async () => {
    if (!backendConfigured) {
      disablePreviewMode();
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    disablePreviewMode();
  };

  const value: AuthContextValue = {
    ready,
    session,
    user: session?.user ?? null,
    backendConfigured,
    isPreviewMode,
    isDevSingleUserMode: devSingleUserMode,
    isAuthenticated: Boolean(session) || isPreviewMode,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }
  return context;
}
