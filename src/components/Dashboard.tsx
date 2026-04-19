'use client';

//Components
import { Badge, Button, IconButton, Menu, MenuItem, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material';
import Organizations from './Organizations';
import Donations from './Donations';
import Users from './Users';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import CustomTabPanel from './CustomTabPanel';
import Loader from './Loader';
import Notifications from './Notifications';
import Inventory from './Inventory';
import Categories from './Categories';
import NotificationFeed from './NotificationFeed';
//Hooks
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { useRouter } from 'next/navigation';
//API
import { addErrorEvent, getNotifications } from '@/api/firebase';
import { fetchNotificationFeedData, getOrganizationNames } from '@/app/actions/firebase';
import { getAllDonations, getAllInventory } from '@/api/firebase-donations';
import { getAllDbUsers } from '@/api/firebase-users';
//Icons
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Dashboard.module.css';
//Types
import { Donation } from '@/models/donation';
import { Notification, NotificationData, NotificationItem } from '@/types/NotificationTypes';
import { IUser } from '@/models/user';
import { InventoryItem } from '@/models/inventoryItem';
import { Category } from '@/models/category';
import { getAllCategories } from '@/api/firebase-categories';
import { CalendlyTimeRange } from '@/types/CalendlyTypes';

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
    const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
    const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
    const [highlightedEntityId, setHighlightedEntityId] = useState<string | null>(null);
    const [notificationsSubTab, setNotificationsSubTab] = useState<number>(0);
    const [categories, setCategories] = useState<Category[] | null>(null);
    const pendingNotificationScrollTop = useRef<number | null>(null);
    const calendlyTimeRange: CalendlyTimeRange = '30days';

    const { requestedInventory } = useRequestedInventoryContext();
    const router = useRouter();

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

    const handleFeedNavigation = useCallback((tabIndex: number, entityId: string) => {
        setCurrentTab(0);
        setNotificationsSubTab(tabIndex);
        setHighlightedEntityId(entityId);
        window.setTimeout(() => setHighlightedEntityId(null), 5000);
    }, []);

    const setNotificationsUpdatedAndPreserveScroll: React.Dispatch<React.SetStateAction<boolean>> = (value) => {
        const updated = typeof value === 'function' ? value(notificationsUpdated) : value;
        if (updated && typeof window !== 'undefined') {
            pendingNotificationScrollTop.current = window.scrollY;
        }
        setNotificationsUpdated(updated);
    };

    async function fetchNotifications(showLoader = false): Promise<void> {
        const shouldBlockContent = showLoader || !notifications;
        if (shouldBlockContent) setIsLoading(true);
        try {
            const notificationsResult = await getNotifications();
            setNotifications(notificationsResult);
            setNotificationsUpdated(false);
            try {
                const feedData = await fetchNotificationFeedData(calendlyTimeRange);
                setNotificationData({
                    ...notificationsResult,
                    pickupBookingStatus: feedData.pickupBookingStatus,
                    dropOffBookingStatus: feedData.dropOffBookingStatus,
                    calendlyTimeRange
                });
                setNotificationItems(feedData.items.map((item) => ({ ...item, timestamp: new Date(item.timestamp) })));
            } catch (error) {
                addErrorEvent('Fetch notification feed data', error);
            }
            if (pendingNotificationScrollTop.current !== null) {
                const scrollTop = pendingNotificationScrollTop.current;
                pendingNotificationScrollTop.current = null;
                requestAnimationFrame(() => window.scrollTo({ top: scrollTop }));
            }
        } catch (error) {
            addErrorEvent('Fetch notifications', error);
        } finally {
            if (shouldBlockContent) setIsLoading(false);
        }
    }

    async function fetchDonations(showLoader = false): Promise<void> {
        if (showLoader || !donations) setIsLoading(true);
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

    async function fetchInventory(showLoader = false): Promise<void> {
        if (showLoader || !inventory) setIsLoading(true);
        try {
            const inventoryResult = await getAllInventory();
            setInventory(inventoryResult);
        } catch (error) {
            addErrorEvent('Could not fetch inventory', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchUsers(showLoader = false): Promise<void> {
        if (showLoader || !users) setIsLoading(true);
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

    async function fetchOrgNames(showLoader = false): Promise<void> {
        if (showLoader || !orgNamesAndIds) setIsLoading(true);
        try {
            const orgNamesResult = await getOrganizationNames();
            setOrgNamesAndIds(orgNamesResult);
            setOrgsUpdated(false);
        } catch (error) {
            addErrorEvent('Could not fetch org names', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchCategories(showLoader = false): Promise<void> {
        if (showLoader || !categories) setIsLoading(true);
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

    // Only fetch collections once when selected unless there's been an update
    useEffect(() => {
        if ((currentTab === 0 && !notifications) || notificationsUpdated || donationsUpdated || usersUpdated) {
            fetchNotifications();
        } else if ((currentTab === 1 && !donations) || donationsUpdated) {
            fetchDonations();
        } else if ((currentTab === 2 && !inventory) || inventoryUpdated) {
            fetchInventory();
        } else if ((currentTab === 3 && !users) || usersUpdated) {
            fetchUsers();
        } else if ((currentTab === 4 && !orgNamesAndIds) || orgsUpdated) {
            fetchOrgNames();
        } else if ((currentTab === 5 && !categories) || categoriesUpdated) {
            fetchCategories();
        }
    }, [currentTab, donationsUpdated, inventoryUpdated, usersUpdated, orgsUpdated, notificationsUpdated, categoriesUpdated]);

    return (
        <ProtectedAdminRoute>
            <div className={styles['navbar']} data-unmask="true" style={{ alignItems: 'center' }}>
                {matches ? (
                    <Tabs value={currentTab} onChange={handleCurrentTab} aria-label="dashboard" variant="scrollable" scrollButtons="auto" sx={{ flex: 1 }}>
                        {tabOptions.map((tab) => (
                            <Tab key={tab} label={tab} sx={{ color: 'black' }} />
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
                <NotificationFeed items={notificationItems} onNavigate={handleFeedNavigation} notificationData={notificationData} />
                <IconButton onClick={handleRefresh} size="small" sx={{ ml: 0.5 }}>
                    <RefreshIcon fontSize="small" />
                </IconButton>
            </div>
            {isLoading ? (
                <Loader />
            ) : (
                <>

                    <CustomTabPanel value={currentTab} index={0}>
                        {notifications ? (
                            <Notifications
                                notifications={notifications}
                                setNotificationsUpdated={setNotificationsUpdatedAndPreserveScroll}
                                activeSubTab={notificationsSubTab}
                                onSubTabChange={setNotificationsSubTab}
                                notificationData={notificationData}
                                highlightedEntityId={highlightedEntityId}
                            />
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
