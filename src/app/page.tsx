'use client';

//Hooks
import { useUserContext } from '@/contexts/UserContext';
import { redirect } from 'next/navigation';

//Components
import HomePage from '@/components/HomePage';
import Loader from '@/components/Loader';
import Dashboard from '@/components/Dashboard';
import Inventory from '@/components/Inventory';

export default function Home() {
    const { isAdmin, isAidWorker } = useUserContext();

    if (isAdmin) {
        return <Dashboard />;
    }

    if (isAidWorker) {
        return <Inventory />;
    }

    if (!isAdmin || !isAidWorker) {
        return <HomePage />;
    }

    return <Loader />;
}
