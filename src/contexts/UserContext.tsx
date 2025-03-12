'use client';

import { onAuthStateChangedListener, checkIsAdmin } from '@/api/firebase';
import { User } from 'firebase/auth';
import { createContext, useState, useEffect, ReactNode, useContext } from 'react';

type UserContextType = {
    currentUser: User | null;
    isLoading: boolean;
    isAdmin: boolean;
};

type Props = {
    children: ReactNode;
};

export const UserContext = createContext<UserContextType>({
    currentUser: null,
    isLoading: false,
    isAdmin: false
});

export const UserProvider = ({ children }: Props) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const value = {
        currentUser,
        isLoading,
        isAdmin
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChangedListener(async (user) => {
            if (!user) {
                setCurrentUser(null);
                setIsLoading(false);
            }
            if (user) {
                setIsLoading(true);
                setCurrentUser(user);
                setIsLoading(false);
                const adminResult = await checkIsAdmin(user);
                setIsAdmin(adminResult);
            }
        });
        return unsubscribe;
    }, []);

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = () => useContext(UserContext);
