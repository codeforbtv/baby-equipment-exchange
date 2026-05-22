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
//API
import { addErrorEvent, callGetOrganizationNames, getNotifications } from '@/api/firebase';
import { getAllDonations, getAllInventory } from '@/api/firebase-donations';
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
import { InventoryItem } from '@/models/inventoryItem';
import { Category } from '@/models/category';
import { getAllCategories } from '@/api/firebase-categories';

const tabOptions = ['Notifications', 'Donations', 'Inventory', 'Users', 'Organizations', 'Categories'];

export default function Dashboard() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentTab, setCurrentTab] = useState<number>(0);
    const [donations, setDonations] = useState<Donation[] | null>(null);
    const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
    const [users, setUsers] = useState<IUser[] | null>(null);
    const [orgNamesAndIds, setOrgNamesAndIds] = useState<{
        [key: string]: string;
    } | null>(null);
    const [notifications, setNotifications] = useState<Notification | null>(null);
    const [categories, setCategories] = useState<Category[] | null>(null);

    //Track whether updates have been made
    const [notificationsUpdated, setNotificationsUpdated] = useState<boolean>(false);
    const [donationsUpdated, setDonationsUpdated] = useState<boolean>(false);
    const [inventoryUpdated, setInventoryUpdated] = useState<boolean>(false);
    const [usersUpdated, setUsersUpdated] = useState<boolean>(false);
    const [orgsUpdated, setOrgsUpdated] = useState<boolean>(false);
    const [categoriesUpdated, setCategoriesUpdated] = useState<boolean>(false);

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

    const fetchNotifications = useCallback(async (showLoader = false): Promise<void> => {
        if (showLoader) {
            setIsLoading(true);
        }
        try {
            const notificationsResult = await getNotifications();
            setNotifications(notificationsResult);
            setNotificationsUpdated(false);
        } catch (error) {
            addErrorEvent('Fetch notifications', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchDonations = useCallback(async (showLoader = false): Promise<void> => {
        if (showLoader) {
            setIsLoading(true);
        }
        try {
            const donationsResult = await getAllDonations();
            setDonations(donationsResult);
            setDonationsUpdated(false);
        } catch (error) {
            addErrorEvent('Error fetching all donations', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchInventory = useCallback(async (showLoader = false): Promise<void> => {
        if (showLoader) {
            setIsLoading(true);
        }
        try {
            const inventoryResult = await getAllInventory();
            setInventory(inventoryResult);
            setInventoryUpdated(false);
        } catch (error) {
            addErrorEvent('Could not fetch inventory', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUsers = useCallback(async (showLoader = false): Promise<void> => {
        if (showLoader) {
            setIsLoading(true);
        }
        try {
            const usersResult = await getAllDbUsers();
            setUsers(usersResult.filter((user) => !user.isDeleted));
            setUsersUpdated(false);
        } catch (error) {
            addErrorEvent('Error fetching all users', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchOrgNames = useCallback(async (showLoader = false): Promise<void> => {
        if (showLoader) {
            setIsLoading(true);
        }
        try {
            const orgNamesResult = await callGetOrganizationNames();
            setOrgNamesAndIds(orgNamesResult);
            setOrgsUpdated(false);
        } catch (error) {
            addErrorEvent('Could not fetch org names', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async (showLoader = false): Promise<void> => {
        if (showLoader) {
            setIsLoading(true);
        }
        try {
            const categoriesResult = await getAllCategories();
            setCategories(categoriesResult);
            setCategoriesUpdated(false);
        } catch (error) {
            addErrorEvent('Could not fetch categories', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    function handleRefresh() {
        if (currentTab === 0) {
            fetchNotifications(true);
        } else if (currentTab === 1) {
            fetchDonations(true);
        } else if (currentTab === 2) {
            fetchInventory(true);
        } else if (currentTab === 3) {
            fetchUsers(true);
        } else if (currentTab === 4) {
            fetchOrgNames(true);
        } else if (currentTab === 5) {
            fetchCategories(true);
        }
    }

    // Only fetch each collection once when its tab is selected.
    useEffect(() => {
        if (currentTab === 0 && !notifications) {
            fetchNotifications(true);
        } else if (currentTab === 1 && !donations) {
            fetchDonations(true);
        } else if (currentTab === 2 && !inventory) {
            fetchInventory(true);
        } else if (currentTab === 3 && !users) {
            fetchUsers(true);
        } else if (currentTab === 4 && !orgNamesAndIds) {
            fetchOrgNames(true);
        } else if (currentTab === 5 && !categories) {
            fetchCategories(true);
        }
    }, [
        categories,
        currentTab,
        donations,
        fetchCategories,
        fetchDonations,
        fetchInventory,
        fetchNotifications,
        fetchOrgNames,
        fetchUsers,
        inventory,
        notifications,
        orgNamesAndIds,
        users
    ]);

    useEffect(() => {
        if (notificationsUpdated) {
            fetchNotifications();
        }
    }, [fetchNotifications, notificationsUpdated]);

    useEffect(() => {
        if (donationsUpdated) {
            fetchDonations();
            fetchNotifications();
        }
    }, [donationsUpdated, fetchDonations, fetchNotifications]);

    useEffect(() => {
        if (inventoryUpdated) {
            fetchInventory();
        }
    }, [fetchInventory, inventoryUpdated]);

    useEffect(() => {
        if (usersUpdated) {
            fetchUsers();
            fetchNotifications();
        }
    }, [fetchNotifications, fetchUsers, usersUpdated]);

    useEffect(() => {
        if (orgsUpdated) {
            fetchOrgNames();
        }
    }, [fetchOrgNames, orgsUpdated]);

    useEffect(() => {
        if (categoriesUpdated) {
            fetchCategories();
        }
    }, [categoriesUpdated, fetchCategories]);

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
