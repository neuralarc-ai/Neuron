import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CORRECT_PIN = "147812";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if there's a session cookie or local storage
        const sessionData = localStorage.getItem("neuron-auth-session");
        if (sessionData) {
          const { timestamp } = JSON.parse(sessionData);
          // Check if session is still valid (24 hours)
          const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
          if (!isExpired) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("neuron-auth-session");
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        localStorage.removeItem("neuron-auth-session");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (pin: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (pin === CORRECT_PIN) {
        // Store session data
        const sessionData = {
          authenticated: true,
          timestamp: Date.now(),
        };
        localStorage.setItem("neuron-auth-session", JSON.stringify(sessionData));
        setIsAuthenticated(true);
      } else {
        throw new Error("Invalid PIN. Please try again.");
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("neuron-auth-session");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
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
