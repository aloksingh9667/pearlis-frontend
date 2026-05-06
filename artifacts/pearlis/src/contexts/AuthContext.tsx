import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, setAuthTokenGetter, setSessionIdGetter } from "@workspace/api-client-react";
import { apiUrl } from "@/lib/apiUrl";

function getOrCreateSessionId(): string {
  let id = localStorage.getItem("pearlis_session_id");
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("pearlis_session_id", id);
  }
  return id;
}

interface AuthUser {
  id: number;
  email: string;
  name: string;
  avatar?: string | null;
  role: string;
  createdAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  useEffect(() => {
    setSessionIdGetter(() => getOrCreateSessionId());
    setAuthTokenGetter(async () => localStorage.getItem("token"));
  }, []);

  const { data: userData, isLoading } = useGetMe({
    query: { enabled: !!token, retry: false },
  });

  const user = (userData as AuthUser | undefined) ?? null;
  const isAdmin = user?.role === "admin";

  const login = (newToken: string) => {
    const guestSessionId = localStorage.getItem("pearlis_session_id");

    const mergeGuestCart = async () => {
      if (!guestSessionId) return;
      try {
        const guestCartRes = await fetch(apiUrl("/api/cart"), {
          headers: { "X-Session-Id": guestSessionId },
        });
        if (!guestCartRes.ok) return;
        const guestCart = await guestCartRes.json();
        const items: Array<{ productId: number; quantity: number }> = (guestCart.items || []).map(
          (item: any) => ({ productId: item.productId, quantity: item.quantity })
        );
        if (items.length === 0) return;
        await Promise.all(
          items.map((item) =>
            fetch(apiUrl("/api/cart/items"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
            }).catch(() => {})
          )
        );
      } catch {
      }
    };

    localStorage.setItem("token", newToken);
    setToken(newToken);
    mergeGuestCart();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: !!token && isLoading, isAdmin, login, logout }}>
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
