'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  
  const router = useRouter();

  // Refresh tokens automatically
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
        });
        return true;
      } else {
        // Refresh failed, clear auth state
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      return false;
    }
  }, []);

  // Login function
  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
        });
        router.push('/');
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Network error' };
    }
  }, [router]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      router.push('/login');
    }
  }, [router]);

  // Initialize auth state and set up automatic refresh
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    const initializeAuth = async () => {
      const success = await refreshToken();
      
      if (success) {
        // Set up automatic token refresh every 10 minutes
        refreshInterval = setInterval(() => {
          refreshToken();
        }, 10 * 60 * 1000); // 10 minutes
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initializeAuth();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshToken]);

  // Listen for refresh token header from middleware
  useEffect(() => {
    const handleRefreshHeader = () => {
      const refreshHeader = document.querySelector('meta[name="x-refresh-token"]');
      if (refreshHeader) {
        refreshToken();
        refreshHeader.remove();
      }
    };

    // Check for refresh header on page load
    handleRefreshHeader();

    // Set up a mutation observer to watch for new refresh headers
    const observer = new MutationObserver(handleRefreshHeader);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [refreshToken]);

  return {
    ...authState,
    login,
    logout,
    refreshToken,
  };
}
