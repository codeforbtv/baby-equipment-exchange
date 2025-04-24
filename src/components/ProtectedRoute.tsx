'use client';
//Components
import Loader from './Loader';
//hooks
import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useUserContext } from '@/contexts/UserContext';
//Styling
import '../styles/globalStyles.css';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { currentUser, isLoading } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !currentUser) {
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

    if (currentUser) return <Suspense fallback={<Loader />}>{children}</Suspense>;

    return null;
}
