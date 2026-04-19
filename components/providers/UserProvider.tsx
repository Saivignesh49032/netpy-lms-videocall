'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { UserProfile } from '@/hooks/useUser';

// We want to pass the initial Server-Side Fetched profile directly to the client
const UserContext = createContext<{ user: UserProfile | null; isLoaded: boolean }>({
  user: null,
  isLoaded: false,
});

export function UserProvider({ children, initialUser }: { children: ReactNode; initialUser: UserProfile | null }) {
  // If we have an initialUser from the layout, the context is "loaded" on the very first frame.
  return (
    <UserContext.Provider value={{ user: initialUser, isLoaded: true }}>
      {children}
    </UserContext.Provider>
  );
}

// Hook specifically for the context
export const useUserContext = () => useContext(UserContext);
