import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, auth } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { user, error } = await auth.getCurrentUser();
        if (user && !error) {
          setUser(user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error("Login failed. Please try again.");
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const { error } = await auth.signOut();
      if (error) {
        console.error("Logout error:", error);
      }
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
