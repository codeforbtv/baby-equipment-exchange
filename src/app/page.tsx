'use client';

//Hooks
import { useUserContext } from '@/contexts/UserContext';

//Components
import HomePage from '@/components/HomePage';
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

    return <HomePage />;
}
