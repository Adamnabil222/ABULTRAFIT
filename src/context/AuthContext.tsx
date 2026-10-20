import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle as fbLoginGoogle, logoutUser as fbLogout } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  isGuest: boolean;
  loading: boolean;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'abultrafit_guest_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem(GUEST_STORAGE_KEY) === 'true';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        setIsGuest(false);
        localStorage.removeItem(GUEST_STORAGE_KEY);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginGoogle = async () => {
    try {
      await fbLoginGoogle();
      setIsGuest(false);
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch (err) {
      console.error('Login error', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (user) {
        await fbLogout();
      }
      setIsGuest(false);
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem(GUEST_STORAGE_KEY, 'true');
  };

  // If user is authenticated, use their UID. If guest, use persistent guest UID.
  const userId = user?.uid || (isGuest ? 'guest_abultrafit_user' : 'guest_abultrafit_user');
  const userEmail = user?.email || (isGuest ? 'حساب تجريبي / محلي' : null);
  const userName = user?.displayName || (isGuest ? 'مدير الحسابات' : 'مستخدم');

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        userEmail,
        userName,
        isGuest,
        loading,
        loginGoogle,
        logout,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
