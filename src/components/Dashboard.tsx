'use client';

//Components
import { Button, Tab, Tabs } from '@mui/material';
import Organizations from './Organizations';
import Donations from './Donations';
import Users from './Users';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import CustomTabPanel from './CustomTabPanel';
import Loader from './Loader';
import Notifications from './Notifications';
//Hooks
import React, { useEffect, useState } from 'react';
//API
import { addErrorEvent, callGetOrganizationNames, callListAllUsers, getNotifications } from '@/api/firebase';
import { getAllDonations } from '@/api/firebase-donations';
//Types
import { Donation } from '@/models/donation';
import { AuthUserRecord } from '@/types/UserTypes';
import { Notification } from '@/types/NotificationTypes';

export default function Dashboard() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentTab, setCurrentTab] = useState<number>(0);
    const [donations, setDonations] = useState<Donation[] | null>(null);
    const [users, setUsers] = useState<AuthUserRecord[] | null>(null);
    const [orgNamesAndIds, setOrgNamesAndIds] = useState<{
        [key: string]: string;
    } | null>(null);
    const [notifications, setNotifications] = useState<Notification | null>(null);

    //Track whether updates have been made
    const [notificationsUpdated, setNotificationsUpdated] = useState<boolean>(false);
    const [donationsUpdated, setDonationsUpdated] = useState<boolean>(false);
    const [usersUpdated, setUsersUpdated] = useState<boolean>(false);
    const [orgsUpdated, setOrgsUpdated] = useState<boolean>(false);

    const handleCurrentTab = (event: React.SyntheticEvent, target: number) => {
        setCurrentTab(target);
    };

    async function fetchNotifications(): Promise<void> {
        setIsLoading(true);
        try {
            const notificationsResult = await getNotifications();
            setNotifications(notificationsResult);
            setNotificationsUpdated(false);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Fetch notifications', error);
        }
    }

    async function fetchDonations(): Promise<void> {
        setIsLoading(true);
        try {
            const donationsResult = await getAllDonations();
            setDonations(donationsResult);
            setDonationsUpdated(false);
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
            setUsersUpdated(false);
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
            setOrgsUpdated(false);
            setIsLoading(false);
        } catch (error) {
            addErrorEvent('Could not fetch org names', error);
            setIsLoading(false);
        }
        setIsLoading(false);
    };

    // Only fetch collections once when selected unless there's been an update
    useEffect(() => {
        if ((currentTab === 0 && !notifications) || (currentTab === 0 && notificationsUpdated)) {
            fetchNotifications();
        }
        if ((currentTab === 1 && !donations) || (currentTab === 1 && donationsUpdated)) {
            fetchDonations();
        } else if ((currentTab === 2 && !users) || (currentTab === 2 && usersUpdated)) {
            fetchUsers();
        } else if ((currentTab === 3 && !orgNamesAndIds) || (currentTab === 3 && orgsUpdated)) {
            fetchOrgNames();
        }
    }, [currentTab, donationsUpdated, usersUpdated, orgsUpdated]);

    return (
        <ProtectedAdminRoute>
            <div style={{ marginTop: '4rem' }}>
                <Tabs value={currentTab} onChange={handleCurrentTab} aria-label="dashboard">
                    <Tab label="Notifications" />
                    <Tab label="Donations" />
                    <Tab label="Users" />
                    <Tab label="Organizations" />
                </Tabs>
                {isLoading ? (
                    <Loader />
                ) : (
                    <>
                        <CustomTabPanel value={currentTab} index={0}>
                            {notifications ? (
                                <Notifications notifications={notifications} setNotificationsUpdated={setNotificationsUpdated} />
                            ) : (
                                <p>No notifications at this time.</p>
                            )}
                        </CustomTabPanel>
                        <CustomTabPanel value={currentTab} index={1}>
                            {donations ? <Donations donations={donations} setDonationsUpdated={setDonationsUpdated} /> : <p>No donations found.</p>}
                        </CustomTabPanel>
                        <CustomTabPanel value={currentTab} index={2}>
                            {users ? <Users users={users} setUsersUpdated={setUsersUpdated} /> : <p>No users found.</p>}
                        </CustomTabPanel>
                        <CustomTabPanel value={currentTab} index={3}>
                            {orgNamesAndIds ? (
                                <Organizations orgNamesAndIds={orgNamesAndIds} setOrgsUpdated={setOrgsUpdated} />
                            ) : (
                                <p>No organizations found.</p>
                            )}
                        </CustomTabPanel>
                    </>
                )}
            </div>
        </ProtectedAdminRoute>
    );
}
