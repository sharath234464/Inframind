import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  type CurrentUser,
} from "../services/authService";

interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<CurrentUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        localStorage.setItem("user_role", currentUser.role);
        localStorage.setItem("user_email", currentUser.email);
      } catch {
        logoutUser();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const tokenResponse = await loginUser({ email, password });

    localStorage.setItem("access_token", tokenResponse.access_token);
    localStorage.setItem("user_email", email);

    try {
      // The backend profile is the source of truth for identity and role.
      const profile = await getCurrentUser();
      localStorage.setItem("user_role", profile.role);
      localStorage.setItem("user_email", profile.email);
      localStorage.setItem("user_id", profile.user_id);
      setUser(profile);
      return profile;
    } catch (error) {
      logoutUser();
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
