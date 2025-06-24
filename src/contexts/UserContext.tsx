'use client';

import { onAuthStateChangedListener, checkIsAdmin, checkIsAidWorker } from '@/api/firebase';
import { User } from 'firebase/auth';
import { createContext, useState, useEffect, ReactNode, useContext } from 'react';

type UserContextType = {
    currentUser: User | null;
    isLoading: boolean;
    isAdmin: boolean;
    isAidWorker: boolean;
};

type Props = {
    children: ReactNode;
};

export const UserContext = createContext<UserContextType>({
    currentUser: null,
    isLoading: false,
    isAdmin: false,
    isAidWorker: false
});

export const UserProvider = ({ children }: Props) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isAidWorker, setIsAidworker] = useState<boolean>(false);
    const value = {
        currentUser,
        isLoading,
        isAdmin,
        isAidWorker
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
                const aidWorkerResult = await checkIsAidWorker(user);
                setIsAidworker(aidWorkerResult);
            }
        });
        return unsubscribe;
    }, []);

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = () => useContext(UserContext);
