"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, firebaseInitialized } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  firebaseInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, firebaseInitialized: false });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only try to set up an auth listener if Firebase was initialized
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });
      
      // Cleanup subscription on unmount
      return () => unsubscribe();
    } else {
      // If Firebase isn't initialized, we are not in a loading state.
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, firebaseInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
