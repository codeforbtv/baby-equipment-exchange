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
import Inventory from './Inventory';
import Categories from './Categories';
//Hooks
import React, { useCallback, useEffect, useState } from 'react';
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
//API
import { addErrorEvent, callGetOrganizationNames } from '@/api/firebase';
import { getAllDonations, getDonationNotifications, getInventory, getOrdersNotifications } from '@/api/firebase-donations';
import { getAllDbUsers, getUsersNotifications } from '@/api/firebase-users';
//Icons
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RefreshIcon from '@mui/icons-material/Refresh';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Dashboard.module.css';
//Types
import { Donation } from '@/models/donation';
import { IUser } from '@/models/user';
import { InventoryItem } from '@/models/inventoryItem';
import { Category } from '@/models/category';
import { Order } from '@/types/OrdersTypes';
import { getAllCategories } from '@/api/firebase-categories';

const tabOptions = ['Notifications', 'Donations', 'Inventory', 'Users', 'Organizations', 'Categories'];

export default function Dashboard() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentTab, setCurrentTab] = useState<number>(0);

    // Tab data
    const [donations, setDonations] = useState<Donation[] | null>(null);
    const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
    const [users, setUsers] = useState<IUser[] | null>(null);
    const [orgNamesAndIds, setOrgNamesAndIds] = useState<{ [key: string]: string } | null>(null);
    const [categories, setCategories] = useState<Category[] | null>(null);

    // Notification data — three independent slices
    // Each can be fetched and invalidated independently so a donation change
    // doesn't trigger a re-read of Users or Orders.
    const [notifDonations, setNotifDonations] = useState<Donation[] | null>(null);
    const [notifOrders, setNotifOrders] = useState<Order[] | null>(null);
    const [notifUsers, setNotifUsers] = useState<IUser[] | null>(null);

    // Staleness flags
    // When a child component mutates data (e.g. editing a donation in the
    // Donations tab), it sets the relevant flag to true. On the next tab visit,
    // only the stale collection is re-fetched.
    //
    // Cross-tab linkage: donationsUpdated also invalidates notifDonations;
    // usersUpdated also invalidates notifUsers. This ensures the Notifications
    // tab sees fresh data after mutations in other tabs.
    const [donationsUpdated, setDonationsUpdated] = useState<boolean>(false);
    const [inventoryUpdated, setInventoryUpdated] = useState<boolean>(false);
    const [usersUpdated, setUsersUpdated] = useState<boolean>(false);
    const [orgsUpdated, setOrgsUpdated] = useState<boolean>(false);
    const [categoriesUpdated, setCategoriesUpdated] = useState<boolean>(false);

    // Notification-slice staleness — set by cross-tab linkage or by mutations
    // within the Notifications tab itself (via NotificationCallbacks).
    const [notifDonationsStale, setNotifDonationsStale] = useState<boolean>(false);
    const [notifOrdersStale, setNotifOrdersStale] = useState<boolean>(false);
    const [notifUsersStale, setNotifUsersStale] = useState<boolean>(false);

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

    // Notification fetch functions (per-slice)

    const fetchNotifDonations = useCallback(async () => {
        try {
            const result = await getDonationNotifications();
            setNotifDonations(result);
            setNotifDonationsStale(false);
        } catch (error) {
            addErrorEvent('fetchNotifDonations', error);
        }
    }, []);

    const fetchNotifOrders = useCallback(async () => {
        try {
            const result = await getOrdersNotifications();
            setNotifOrders(result);
            setNotifOrdersStale(false);
        } catch (error) {
            addErrorEvent('fetchNotifOrders', error);
        }
    }, []);

    const fetchNotifUsers = useCallback(async () => {
        try {
            const result = await getUsersNotifications();
            setNotifUsers(result);
            setNotifUsersStale(false);
        } catch (error) {
            addErrorEvent('fetchNotifUsers', error);
        }
    }, []);

    /**
     * Unconditionally re-fetch all three notification slices.
     * Used by handleRefresh — no dependency on staleness flags.
     */
    const refreshAllNotifications = useCallback(async () => {
        setIsLoading(true);
        await Promise.allSettled([
            fetchNotifDonations(),
            fetchNotifOrders(),
            fetchNotifUsers()
        ]);
        setIsLoading(false);
    }, [fetchNotifDonations, fetchNotifOrders, fetchNotifUsers]);

    /**
     * Selectively fetch only the notification slices that are missing or stale.
     * Used by the tab-switch useEffect when navigating to the Notifications tab.
     */
    const fetchStaleNotifications = useCallback(async () => {
        const fetches: Promise<void>[] = [];
        if (!notifDonations || notifDonationsStale) fetches.push(fetchNotifDonations());
        if (!notifOrders || notifOrdersStale) fetches.push(fetchNotifOrders());
        if (!notifUsers || notifUsersStale) fetches.push(fetchNotifUsers());

        if (fetches.length === 0) return;
        setIsLoading(true);
        await Promise.allSettled(fetches);
        setIsLoading(false);
    }, [notifDonations, notifOrders, notifUsers, notifDonationsStale, notifOrdersStale, notifUsersStale, fetchNotifDonations, fetchNotifOrders, fetchNotifUsers]);

    // Tab data fetch functions

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

    async function fetchInventory(): Promise<void> {
        setIsLoading(true);
        try {
            const inventoryResult = await getInventory();
            setInventory(inventoryResult);
        } catch (error) {
            addErrorEvent('Could not fetch inventory', error);
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

    async function fetchCategories(): Promise<void> {
        setIsLoading(true);
        try {
            const categoriesResult = await getAllCategories();
            setCategories(categoriesResult);
            setCategoriesUpdated(false);
        } catch (error) {
            addErrorEvent('Could not fetch categories', error);
        } finally {
            setIsLoading(false);
        }
    }

    // Cross-tab staleness linkage
    // When a donation is modified in the Donations tab, also mark
    // notification-donations as stale so only that slice is re-fetched
    // when the user navigates back to the Notifications tab.
    useEffect(() => {
        if (donationsUpdated) {
            setNotifDonationsStale(true);
            // Orders contain donation refs, so they may also be stale.
            setNotifOrdersStale(true);
        }
    }, [donationsUpdated]);

    useEffect(() => {
        if (usersUpdated) {
            setNotifUsersStale(true);
        }
    }, [usersUpdated]);

    // Manual refresh
    function handleRefresh() {
        if (currentTab === 0) {
            refreshAllNotifications();
        } else if (currentTab === 1) {
            fetchDonations();
        } else if (currentTab === 2) {
            fetchInventory();
        } else if (currentTab === 3) {
            fetchUsers();
        } else if (currentTab === 4) {
            fetchOrgNames();
        } else if (currentTab === 5) {
            fetchCategories();
        }
    }

    // Tab-switch data loading
    // Only fetch when the tab is selected AND either the data is missing or
    // stale. Notifications check per-slice staleness; other tabs check their
    // own updated flag.
    useEffect(() => {
        if (currentTab === 0) {
            fetchStaleNotifications();
        } else if (currentTab === 1 && (!donations || donationsUpdated)) {
            fetchDonations();
        } else if (currentTab === 2 && (!inventory || inventoryUpdated)) {
            fetchInventory();
        } else if (currentTab === 3 && (!users || usersUpdated)) {
            fetchUsers();
        } else if (currentTab === 4 && (!orgNamesAndIds || orgsUpdated)) {
            fetchOrgNames();
        } else if (currentTab === 5 && (!categories || categoriesUpdated)) {
            fetchCategories();
        }
    }, [currentTab, donationsUpdated, inventoryUpdated, usersUpdated, orgsUpdated, categoriesUpdated, fetchStaleNotifications]);

    // Build the NotificationData object for the Notifications component
    // Only constructed when all three slices have loaded.
    const notificationData =
        notifDonations && notifOrders && notifUsers
            ? { donations: notifDonations, orders: notifOrders, users: notifUsers }
            : null;

    return (
        <ProtectedAdminRoute>
            <div className={styles['navbar']}>
                {matches ? (
                    <>
                        <Tabs value={currentTab} onChange={handleCurrentTab} aria-label="dashboard" variant="scrollable" scrollButtons="auto">
                            {tabOptions.map((tab) => (
                                <Tab key={tab} label={tab} sx={{ color: 'black' }} />
                            ))}
                        </Tabs>
                    </>
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
            </div>
            {isLoading ? (
                <Loader />
            ) : (
                <>
                    <IconButton onClick={handleRefresh} size="large" sx={{ marginRight: 'auto', backgroundColor: '#f1f1f1', marginTop: '1rem' }}>
                        <RefreshIcon />
                    </IconButton>

                    <CustomTabPanel value={currentTab} index={0}>
                        {notificationData ? (
                            <Notifications notifications={notificationData} />
                        ) : (
                            <p>No notifications at this time.</p>
                        )}
                    </CustomTabPanel>
                    <CustomTabPanel value={currentTab} index={1}>
                        {donations ? <Donations donations={donations} setDonationsUpdated={setDonationsUpdated} /> : <p>No donations found.</p>}
                    </CustomTabPanel>
                    <CustomTabPanel value={currentTab} index={2}>
                        {inventory ? <Inventory inventory={inventory} setInventoryUpdated={setInventoryUpdated} /> : <p>No inventory found.</p>}
                    </CustomTabPanel>
                    <CustomTabPanel value={currentTab} index={3}>
                        {users ? <Users users={users} setUsersUpdated={setUsersUpdated} /> : <p>No users found.</p>}
                    </CustomTabPanel>
                    <CustomTabPanel value={currentTab} index={4}>
                        {orgNamesAndIds ? <Organizations orgNamesAndIds={orgNamesAndIds} setOrgsUpdated={setOrgsUpdated} /> : <p>No organizations found.</p>}
                    </CustomTabPanel>
                    <CustomTabPanel value={currentTab} index={5}>
                        {categories ? <Categories categories={categories} setCategoriesUpdated={setCategoriesUpdated} /> : <p>No categories found.</p>}
                    </CustomTabPanel>
                </>
            )}
        </ProtectedAdminRoute>
    );
}
