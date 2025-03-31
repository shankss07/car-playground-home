// src/services/AuthService.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define user types
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarColor: string;
  carType?: string;
  carColor?: number;
}

// Auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, displayName: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<User>) => void;
}

// Create a simple email validator
const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Generate random ID for users (in a real app, this would come from the backend)
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Generate a random color for user avatars
const getRandomColor = (): string => {
  const colors = [
    '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
    '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', 
    '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', 
    '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Create auth store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, displayName: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Validate email format
          if (!isValidEmail(email)) {
            throw new Error('Invalid email format');
          }
          
          // Validate displayName
          if (!displayName || displayName.trim().length < 3) {
            throw new Error('Display name must be at least 3 characters');
          }
          
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Create a new user (in a real app, this would come from your backend)
          const newUser: User = {
            id: generateId(),
            email,
            displayName,
            avatarColor: getRandomColor(),
            carColor: 0xff0000 // Default red car
          };
          
          set({ 
            user: newUser,
            isAuthenticated: true,
            isLoading: false
          });
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An unknown error occurred',
            isLoading: false 
          });
        }
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      
      updateProfile: (profile: Partial<User>) => {
        set(state => ({
          user: state.user ? { ...state.user, ...profile } : null
        }));
      }
    }),
    {
      name: 'turbo-racing-auth' // localStorage key
    }
  )
);