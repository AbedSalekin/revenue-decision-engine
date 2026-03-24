import { createContext, useContext, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react/src/generated/api.schemas";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading, isError, error } = useGetMe({
    query: {
      retry: false,
      staleTime: 5 * 60 * 1000,
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        localStorage.removeItem("ai_cfo_token");
        window.location.href = "/login";
      },
    }
  });

  // Handle unauthorized redirects natively
  useEffect(() => {
    if (isError) {
      // Clear token if API rejects it
      localStorage.removeItem("ai_cfo_token");
    }
  }, [isError]);

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated: !!user,
        logout: () => logoutMutation.mutate(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
