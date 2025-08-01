'use client';

//Components
import Dashboard from '@/components/Dashboard';
import Donate from './donate/page';
import Inventory from '@/components/Inventory';

//Hooks
import { useUserContext } from '@/contexts/UserContext';

export default function Home() {
    const currentUser = useUserContext();
    const { isAdmin, isAidWorker } = currentUser;

    if (isAdmin) {
        return <Dashboard />;
    } else if (isAidWorker) {
        return <Inventory />;
    } else {
        return <Donate />;
    }
}
