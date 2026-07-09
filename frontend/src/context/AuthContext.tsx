import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, getApiError, usersApi, type LoginPayload, type RegisterPayload } from "../services/api";
import type { User } from "../types/api";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  authError: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "renteasy_token";
const USER_KEY = "renteasy_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [loading, setLoading] = useState(Boolean(token));
  const [authError, setAuthError] = useState<string | null>(null);

  const saveSession = (nextUser: User, nextToken: string) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }

    try {
      const response = await usersApi.me();
      const nextUser = response.data.data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      setAuthError(null);
    } catch (error) {
      setAuthError(getApiError(error));
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      authError,
      login: async (payload) => {
        const response = await authApi.login(payload);
        saveSession(response.data.data.user, response.data.data.token);
      },
      register: async (payload) => {
        const response = await authApi.register(payload);
        saveSession(response.data.data.user, response.data.data.token);
      },
      logout,
      refreshUser
    }),
    [authError, loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
