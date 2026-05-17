'use client';

import { useUserContext } from '@/contexts/UserContext';

import HomePage from '@/components/HomePage';
import Loader from '@/components/Loader';
import Dashboard from '@/components/Dashboard';
import AidWorkerHome from '@/components/aid-worker/AidWorkerHome';

export default function Home() {
    const { isAdmin, isAidWorker } = useUserContext();

    if (isAdmin) {
        return <Dashboard />;
    }

    if (isAidWorker) {
        return <AidWorkerHome />;
    }

    if (!isAdmin || !isAidWorker) {
        return <HomePage />;
    }

    return <Loader />;
}
