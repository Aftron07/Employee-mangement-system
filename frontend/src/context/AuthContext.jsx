
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "ems_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => sessionStorage.getItem(TOKEN_KEY)
  );

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore existing login session
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest(
          "/auth/me",
          {},
          token
        );

        if (!cancelled) {
          setUser({
            ...data.user,
            must_change_password: Boolean(
              data.user.must_change_password
            ),
            employee: data.employee || null,
          });
        }
      } catch (error) {
        sessionStorage.removeItem(TOKEN_KEY);

        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Login user
  async function login(email, password) {
    const data = await apiRequest(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    if (!data.token || !data.user?.role) {
      throw new Error(
        "The server returned an invalid login response."
      );
    }

    sessionStorage.setItem(TOKEN_KEY, data.token);

    setUser(data.user);
    setToken(data.token);

    return data.user;
  }

  // Change password
  async function changePassword(
    currentPassword,
    newPassword
  ) {
    const data = await apiRequest(
      "/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      },
      token
    );

    setUser((current) =>
      current
        ? {
            ...current,
            must_change_password: false,
          }
        : current
    );

    return data;
  }

  // Logout user
  async function logout() {
    const currentToken = token;

    try {
      if (currentToken) {
        await apiRequest(
          "/auth/logout",
          {
            method: "POST",
          },
          currentToken
        );
      }
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      sessionStorage.removeItem(TOKEN_KEY);

      setToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom authentication hook
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
