'use client';
//Components
import Dashboard from '@/components/Dashboard';
import Donate from './donate/page';
//Libs
import { Paper } from '@mui/material';
//Styles
import styles from './HomeStyles.module.css';
//Hooks
import { useUserContext } from '@/contexts/UserContext';

export default function Home() {
    const currentUser = useUserContext();
    const { isAdmin, isAidWorker } = currentUser;

    return <>{isAdmin || isAidWorker ? <Dashboard /> : <Donate />}</>;
}
