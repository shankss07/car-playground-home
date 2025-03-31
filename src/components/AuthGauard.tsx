// src/components/AuthGuard.tsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../services/AuthService';
import LoginModal from './LoginModal';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
    }
  }, [isAuthenticated]);
  
  if (!isAuthenticated) {
    return (
      <>
        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
        />
        <div className="min-h-screen flex flex-col items-center justify-center bg-racing-dark">
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
            <p className="mb-6">Please log in to access this area.</p>
            <button 
              className="px-6 py-2 bg-racing-red hover:bg-red-700 rounded-md text-white"
              onClick={() => setIsLoginModalOpen(true)}
            >
              Log In
            </button>
          </div>
        </div>
      </>
    );
  }
  
  return <>{children}</>;
};

export default AuthGuard;