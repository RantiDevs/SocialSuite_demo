import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // Demo mode: Always authenticated with mock user
    const mockUser = {
      id: 1,
      username: "demo_admin",
      email: "demo@socialsuite.pro",
      subscriptionStatus: "active",
      subscriptionTier: "premium"
    };
    setUser(mockUser);
    setIsAuthenticated(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    queryClient.clear();
    setLocation("/");
  };

  return { isAuthenticated, user, logout, loading, recheck: checkAuth };
}
