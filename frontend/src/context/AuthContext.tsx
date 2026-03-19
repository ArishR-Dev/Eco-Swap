import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, LoginCredentials, RegisterData, AuthResponse, ApiResponse } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { apiCall } from '@/services/api';

/** Single source of truth for auth. Components MUST use useAuth() — never localStorage. */
export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<ApiResponse<AuthResponse>>;
  register: (data: RegisterData) => Promise<ApiResponse<AuthResponse>>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'access_token';
const USER_KEY = 'ewaste_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isAuthenticated = !!accessToken;

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);
        
        if (import.meta.env.DEV) {
          console.log('[Auth] Restoring session:', {
            hasToken: !!token,
            hasUser: !!savedUser
          });
        }
        
        if (token && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setAccessToken(token);
            if (import.meta.env.DEV) {
              console.log('[Auth] Session restored for user:', parsedUser.email);
            }
          } catch (parseError) {
            console.error('[Auth] Failed to parse saved user:', parseError);
            setAccessToken(null);
            setUser(null);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
          }
        } else {
          if (import.meta.env.DEV) {
            console.log('[Auth] No saved session found');
          }
        }
      } catch (error) {
        console.error('[Auth] Error loading user:', error);
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    setLoading(true);

    try {
      const data = await apiCall<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
        _skip401Redirect: true,
      });

      const receivedToken =
        data.access_token ||
        data.token ||
        data.accessToken;

      if (!receivedToken) {
        console.error('[Auth] No token received in login response');
        return {
          success: false,
          error: 'No token received from server',
        };
      }

      setUser(data.user);
      setAccessToken(receivedToken);
      localStorage.setItem(TOKEN_KEY, receivedToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      if (import.meta.env.DEV) {
        console.log('[AUTH] Stored access_token:', receivedToken);
      }

      return {
        success: true,
        data: {
          user: data.user,
          access_token: receivedToken,
        },
      };
    } catch (error) {
      const raw = error instanceof Error ? error.message : 'Login failed';
      let msg = raw;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.error) msg = parsed.error;
      } catch {
        /* not JSON, use raw */
      }
      console.error('[Auth] Login error:', error);
      return {
        success: false,
        error: msg,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (registerData: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    setLoading(true);

    try {
      const data = await apiCall<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        _skip401Redirect: true,
      });

      const receivedToken =
        data.access_token ||
        data.token ||
        data.accessToken;

      if (!receivedToken) {
        console.error('[Auth] No token received in register response');
        return {
          success: false,
          error: 'No token received from server',
        };
      }

      const role = registerData.role;

      // For normal citizens (USER), automatically log in after registration.
      // For COLLECTOR and RECYCLER we do NOT auto-login; they must wait for admin approval.
      if (role === 'USER' || role === 'ADMIN') {
        setUser(data.user);
        setAccessToken(receivedToken);
        localStorage.setItem(TOKEN_KEY, receivedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        if (import.meta.env.DEV) {
          console.log('[AUTH] Stored access_token (register, USER/ADMIN):', receivedToken);
        }
      } else {
        if (import.meta.env.DEV) {
          console.log('[AUTH] Register completed for pending role, not auto-logging in:', role);
        }
      }

      return {
        success: true,
        data: {
          user: data.user,
          access_token: receivedToken,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Register failed';
      console.error('[Auth] Register error:', error);
      return {
        success: false,
        error: msg,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  }, [toast]);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await apiCall<any>('/auth/me', { method: 'GET' });
      if (data) {
        const refreshedUser: User & Record<string, any> = {
          id: data.id,
          email: data.email,
          name: data.name,
          phone: data.phone || '',
          address: data.address || '',
          role: data.role,
          avatar: data.avatar,
          createdAt: data.created_at || data.createdAt,
        };
        // Add role-specific fields
        if (data.role === 'COLLECTOR') {
          refreshedUser.vehicleType = data.vehicle_type || '';
          refreshedUser.licenseNumber = data.license_number || '';
        } else if (data.role === 'RECYCLER') {
          refreshedUser.facilityName = data.facility_name || '';
          refreshedUser.certification = data.certification || '';
        }
        setUser(refreshedUser as User);
        localStorage.setItem(USER_KEY, JSON.stringify(refreshedUser));
      }
    } catch (error) {
      console.error('[Auth] Failed to refresh user:', error);
    }
  }, [accessToken]);

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to get redirect path based on role
export function useRoleRedirect(): string {
  const { user } = useAuth();
  
  if (!user) return '/login';
  
  switch (user.role) {
    case 'ADMIN':
      return '/admin';
    case 'COLLECTOR':
      return '/collector';
    case 'RECYCLER':
      return '/recycler';
    case 'USER':
    default:
      return '/user';
  }
}
