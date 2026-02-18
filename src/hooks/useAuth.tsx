import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Provider role reserved for future SaaS expansion. Not active in Phase 1.
type AppRole = "client" | "provider" | "clerk" | "admin";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  terms_agreed_at: string | null;
  non_circumvention_agreed_at: string | null;
  clerk_jobs_completed: number | null;
  clerk_rating: number | null;
  clerk_level: number | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setRole: (role: AppRole) => Promise<{ error: Error | null }>;
  completeOnboarding: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRoleState] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (roleData) {
      setRoleState(roleData.role as AppRole);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoleState(null);
        }

        if (event === "SIGNED_OUT") {
          setProfile(null);
          setRoleState(null);
        }

        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoleState(null);
  };

  const setRole = async (newRole: AppRole) => {
    if (!user) return { error: new Error("No user logged in") };

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role: newRole });

    if (!error) {
      setRoleState(newRole);
    }

    return { error: error as Error | null };
  };

  const completeOnboarding = async () => {
    if (!user) return { error: new Error("No user logged in") };

    const fullName = user.user_metadata?.full_name || null;

    // Upsert to handle case where profile doesn't exist yet, always saving full_name
    const { error } = await supabase
      .from("profiles")
      .upsert(
        { user_id: user.id, onboarding_completed: true, full_name: fullName },
        { onConflict: "user_id" }
      );

    if (!error) {
      setProfile((prev) =>
        prev
          ? { ...prev, onboarding_completed: true, full_name: fullName }
          : {
              id: "",
              user_id: user.id,
              full_name: fullName,
              company_name: null,
              phone: null,
              avatar_url: null,
              onboarding_completed: true,
              terms_agreed_at: null,
              non_circumvention_agreed_at: null,
              clerk_jobs_completed: null,
              clerk_rating: null,
              clerk_level: null,
            }
      );
    }

    return { error: error as Error | null };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        signUp,
        signIn,
        signOut,
        setRole,
        completeOnboarding,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
