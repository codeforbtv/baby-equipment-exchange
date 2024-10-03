'use client';
//Components
//import Dashboard from '@/components/Dashboard';
import { Paper } from '@mui/material';
//Libs
import React, { useContext } from 'react';

//Styles
import styles from './HomeStyles.module.css';
import '../styles/globalStyles.css';
import { Button } from '@mui/material';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
//Hooks
//import { UserContext } from '@/contexts/UserContext';
//import ProtectedRoute from '@/components/ProtectedRoute';

export default function Home() {
    //const { currentUser } = useContext(UserContext);

    const loginElement = (
        <div className={styles['login__heading-prompt']}>
            <h2>You must be logged in to view donations</h2>
            <Button href="/login" variant="contained" endIcon={<VpnKeyOutlinedIcon />}>
                Log in
            </Button>
        </div>
    );
    //const content = currentUser ? <Dashboard /> : loginElement;
    return (
        <div className="page--header">
            <h1>Browse</h1>
            <h4>[Page Summary]</h4>
        </div>
        //<ProtectedRoute>

            // {/*<Paper className="content--container" elevation={8} square={false}>*/}
            // {/*    {content}*/}
            // {/*</Paper>*/}
        //</ProtectedRoute>
    );
}
