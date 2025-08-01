'use client';

//Components
import { Tab, Tabs } from '@mui/material';
import Browse from './Browse';
import UserManagement from './UserManagement';
import Loader from './Loader';

//Hooks
import React, { useEffect, useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';

export default function Dashboard() {
    const [currentTab, setCurrentTab] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [displayUserManagement, setDisplayUserManagement] = useState<boolean>(false);
    const handleCurrentTab = (event: React.SyntheticEvent, target: number) => {
        setCurrentTab(target);
    };

    const { isAdmin } = useUserContext();

    useEffect(() => {
        setDisplayUserManagement(isAdmin);
        setIsLoading(false);
    }, []);

    return isLoading ? (
        <Loader />
    ) : (
        //Tweak styling
        <div style={{ marginTop: '4rem' }}>
            <Tabs value={currentTab} onChange={handleCurrentTab} aria-label="dashboard">
                <Tab label="Donations" />
                {displayUserManagement && <Tab label="Users" />}
            </Tabs>
            <div role="tabpanel" hidden={currentTab !== 0}>
                <Browse />
            </div>
            {displayUserManagement && (
                <div role="tabpanel" hidden={currentTab !== 1}>
                    <UserManagement />
                </div>
            )}
        </div>
    );
}
