import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { AppState } from 'react-native';
import {
  getStoredAuthToken,
  getStoredUserData,
  logout,
  User,
} from '../services/authApi';
import { passwordStatusMonitor } from '../services/passwordStatusMonitor';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await getStoredAuthToken();
        const storedUser = await getStoredUserData();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Monitor authentication state and manage password status checking
  useEffect(() => {
    // Only start password monitoring after initial loading is complete
    if (!loading) {
      if (isAuthenticated) {
        // Start password status monitoring when user is authenticated
        passwordStatusMonitor.schedulePasswordCheck();

        // Listen for app state changes to check password status on app focus
        const handleAppStateChange = (nextAppState: string) => {
          passwordStatusMonitor.handleAppStateChange(nextAppState);
        };

        const subscription = AppState.addEventListener(
          'change',
          handleAppStateChange,
        );

        return () => {
          subscription?.remove();
        };
      } else {
        // Stop password monitoring when user is not authenticated
        passwordStatusMonitor.stopPasswordCheck();
      }
    }
  }, [isAuthenticated, loading]);

  const login = (authToken: string, userData: User) => {
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    logout: handleLogout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
