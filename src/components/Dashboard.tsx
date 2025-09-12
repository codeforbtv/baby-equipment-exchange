'use client';

//Components
import { Tab, Tabs } from '@mui/material';
import Organizations from '@/app/organizations/page';
import Donations from '@/app/donations/page';
import Users from '@/app/users/page';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import CustomTabPanel from './CustomTabPanel';
import Loader from './Loader';
//Hooks
import React, { useEffect, useState } from 'react';
//API
import { addErrorEvent, callGetOrganizationNames, callListAllUsers } from '@/api/firebase';
import { getAllDonations } from '@/api/firebase-donations';
//Types
import { Donation } from '@/models/donation';
import { AuthUserRecord } from '@/types/UserTypes';

export default function Dashboard() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentTab, setCurrentTab] = useState<number>(0);
    const [donations, setDonations] = useState<Donation[] | null>(null);
    const [users, setUsers] = useState<AuthUserRecord[] | null>(null);
    const [orgNamesAndIds, setOrgNamesAndIds] = useState<{
        [key: string]: string;
    } | null>(null);

    const handleCurrentTab = (event: React.SyntheticEvent, target: number) => {
        setCurrentTab(target);
    };

    async function fetchDonations(): Promise<void> {
        setIsLoading(true);
        try {
            const donationsResult = await getAllDonations();
            setDonations(donationsResult);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Error fetching all donations', error);
        }
    }

    const fetchUsers = async (): Promise<void> => {
        setIsLoading(true);
        try {
            const usersResult = await callListAllUsers();
            setUsers(usersResult);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Error fetching all users', error);
        }
    };

    const fetchOrgNames = async (): Promise<void> => {
        setIsLoading(true);
        try {
            const orgNamesResult = await callGetOrganizationNames();
            setOrgNamesAndIds(orgNamesResult);
            setIsLoading(false);
        } catch (error) {
            addErrorEvent('Could not fetch org names', error);
            setIsLoading(false);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (currentTab === 0 && !donations) {
            fetchDonations();
        } else if (currentTab === 1 && !users) {
            fetchUsers();
        } else if (currentTab === 2 && !orgNamesAndIds) {
            fetchOrgNames();
        }
    }, [currentTab]);

    return (
        <ProtectedAdminRoute>
            <div style={{ marginTop: '4rem' }}>
                <Tabs value={currentTab} onChange={handleCurrentTab} aria-label="dashboard">
                    <Tab label="Donations" />
                    <Tab label="Users" />
                    <Tab label="Organizations" />
                </Tabs>
                {isLoading ? (
                    <Loader />
                ) : (
                    <>
                        <CustomTabPanel value={currentTab} index={0}>
                            {donations ? <Donations donations={donations} /> : <p>No donations found.</p>}
                        </CustomTabPanel>
                        <CustomTabPanel value={currentTab} index={1}>
                            {users ? <Users users={users} /> : <p>No users found.</p>}
                        </CustomTabPanel>
                        <CustomTabPanel value={currentTab} index={2}>
                            {orgNamesAndIds ? <Organizations orgNamesAndIds={orgNamesAndIds} /> : <p>No organizations found.</p>}
                        </CustomTabPanel>
                    </>
                )}
            </div>
        </ProtectedAdminRoute>
    );
}
