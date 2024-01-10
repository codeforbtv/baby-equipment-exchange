'use client';
//Components
import Dashboard from '@/components/Dashboard';
import { Paper } from '@mui/material';
//Libs
import React, { useContext } from 'react';

//Styles
import styles from './HomeStyles.module.css';
import globalStyles from '@/styles/globalStyles.module.scss';
import { Button } from '@mui/material';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
//Hooks
import { UserContext } from '@/contexts/UserContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Home() {
    const { currentUser } = useContext(UserContext);

    const loginElement = (
        <div className={styles['login__heading-prompt']}>
            <h2>You must be logged in to view donations</h2>
            <Button href="/login" variant="contained" endIcon={<VpnKeyOutlinedIcon />}>
                Log in
            </Button>
        </div>
    );
    const content = currentUser ? <Dashboard /> : loginElement;
    return (
        <ProtectedRoute>
            <div className={styles['home__container']}>
                <h1>Browse</h1>
                <h4>[Page Summary]</h4>
                <Paper className={globalStyles['content__container']} elevation={8} square={false}>
                    {content}
                </Paper>
            </div>
        </ProtectedRoute>
    );
}
