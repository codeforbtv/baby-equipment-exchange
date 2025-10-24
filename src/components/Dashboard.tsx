'use client';

//Components
import { Button, IconButton, Menu, MenuItem, Tab, Tabs, useMediaQuery } from '@mui/material';
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
import { addErrorEvent, callGetOrganizationNames, getNotifications } from '@/api/firebase';
import { getAllDonations } from '@/api/firebase-donations';
import { getAllDbUsers } from '@/api/firebase-users';
//Icons
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RefreshIcon from '@mui/icons-material/Refresh';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Dashboard.module.css';
//Types
import { Donation } from '@/models/donation';
import { Notification } from '@/types/NotificationTypes';
import { IUser } from '@/models/user';

const tabOptions = ['Notifications', 'Donations', 'Users', 'Organizations'];

export default function Dashboard() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentTab, setCurrentTab] = useState<number>(0);
    const [donations, setDonations] = useState<Donation[] | null>(null);
    const [users, setUsers] = useState<IUser[] | null>(null);
    const [orgNamesAndIds, setOrgNamesAndIds] = useState<{
        [key: string]: string;
    } | null>(null);
    const [notifications, setNotifications] = useState<Notification | null>(null);

    //Track whether updates have been made
    const [notificationsUpdated, setNotificationsUpdated] = useState<boolean>(false);
    const [donationsUpdated, setDonationsUpdated] = useState<boolean>(false);
    const [usersUpdated, setUsersUpdated] = useState<boolean>(false);
    const [orgsUpdated, setOrgsUpdated] = useState<boolean>(false);

    //for mobile tab menu
    const matches = useMediaQuery('(min-width:600px)');
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuItemClick = (event: React.MouseEvent<HTMLElement>, index: number) => {
        setCurrentTab(index);
        setAnchorEl(null);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleCurrentTab = (event: React.SyntheticEvent, target: number) => {
        setCurrentTab(target);
    };

    async function fetchNotifications(): Promise<void> {
        setIsLoading(true);
        try {
            const notificationsResult = await getNotifications();
            setNotifications(notificationsResult);
            setNotificationsUpdated(false);
        } catch (error) {
            addErrorEvent('Fetch notifications', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchDonations(): Promise<void> {
        setIsLoading(true);
        try {
            const donationsResult = await getAllDonations();
            setDonations(donationsResult);
            setDonationsUpdated(false);
        } catch (error) {
            addErrorEvent('Error fetching all donations', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchUsers(): Promise<void> {
        setIsLoading(true);
        try {
            const usersResult = await getAllDbUsers();
            setUsers(usersResult.filter((user) => !user.isDeleted));
            setUsersUpdated(false);
        } catch (error) {
            addErrorEvent('Error fetching all users', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchOrgNames(): Promise<void> {
        setIsLoading(true);
        try {
            const orgNamesResult = await callGetOrganizationNames();
            setOrgNamesAndIds(orgNamesResult);
            setOrgsUpdated(false);
        } catch (error) {
            addErrorEvent('Could not fetch org names', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleRefresh(): Promise<void> {
        if (currentTab === 0) {
            fetchNotifications();
        } else if (currentTab === 1) {
            fetchDonations();
        } else if (currentTab === 2) {
            fetchUsers();
        } else if (currentTab === 3) {
            fetchOrgNames();
        }
    }

    // Only fetch collections once when selected unless there's been an update
    useEffect(() => {
        if ((currentTab === 0 && !notifications) || notificationsUpdated || donationsUpdated || usersUpdated) {
            fetchNotifications();
        }
        if ((currentTab === 1 && !donations) || donationsUpdated) {
            fetchDonations();
        } else if ((currentTab === 2 && !users) || usersUpdated) {
            fetchUsers();
        } else if ((currentTab === 3 && !orgNamesAndIds) || orgsUpdated) {
            fetchOrgNames();
        }
    }, [currentTab, donationsUpdated, usersUpdated, orgsUpdated, notificationsUpdated]);

    return (
        <ProtectedAdminRoute>
            <div className={styles['navbar']}>
                {matches ? (
                    <Tabs value={currentTab} onChange={handleCurrentTab} aria-label="dashboard" variant="scrollable" scrollButtons="auto">
                        {tabOptions.map((tab) => (
                            <Tab key={tab} label={tab} />
                        ))}
                    </Tabs>
                ) : (
                    <>
                        <Button endIcon={<ArrowDropDownIcon />} onClick={handleClickListItem}>
                            {tabOptions[currentTab]}
                        </Button>
                        <Menu id="selected-tab" anchorEl={anchorEl} open={open} onClose={handleClose}>
                            {tabOptions.map((tab, i) => (
                                <MenuItem key={tab} selected={i === currentTab} onClick={(event) => handleMenuItemClick(event, i)}>
                                    <p>{tab}</p>
                                </MenuItem>
                            ))}
                        </Menu>
                    </>
                )}
                <IconButton onClick={handleRefresh}>
                    <RefreshIcon />
                </IconButton>
            </div>
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
                        {orgNamesAndIds ? <Organizations orgNamesAndIds={orgNamesAndIds} setOrgsUpdated={setOrgsUpdated} /> : <p>No organizations found.</p>}
                    </CustomTabPanel>
                </>
            )}
        </ProtectedAdminRoute>
    );
}
