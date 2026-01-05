'use client';
//Hooks
import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
//Libs
import { addErrorEvent, checkIsAdmin, checkIsAidWorker } from '@/api/firebase';
import { onAuthStateChangedListener } from '@/api/firebase-users';
//Types
import { User } from 'firebase/auth';

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
            setIsLoading(true);
            try {
                if (!user) {
                    setCurrentUser(null);
                }
                if (user) {
                    setCurrentUser(user);
                    const adminResult = await checkIsAdmin(user);
                    setIsAdmin(adminResult);
                    const aidWorkerResult = await checkIsAidWorker(user);
                    setIsAidworker(aidWorkerResult);
                }
            } catch (error) {
                addErrorEvent('Error updating user context', error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        });
        return () => unsubscribe;
    }, []);

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = () => useContext(UserContext);
