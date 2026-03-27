'use client';
//Components
import Loader from './Loader';
//hooks
import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useUserContext } from '@/contexts/UserContext';
//Styling
import '../styles/globalStyles.css';

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
    const { currentUser, isLoading, isAdmin } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        if ((!isLoading && !currentUser) || (currentUser && !isAdmin)) {
            router.push('/login');
        }
    }, [currentUser, isLoading]);

    if (isLoading) {
        return (
            <div className="content__container">
                <Loader />
            </div>
        );
    }

    if (currentUser && isAdmin) return <Suspense fallback={<Loader />}>{children}</Suspense>;

    return null;
}
