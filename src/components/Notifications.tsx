'use client';
// Hooks
import { Dispatch, SetStateAction, createContext, useEffect, useState } from 'react';
import React from 'react';

// Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import UserDetails from '@/components/UserDetails';
import DonationDetails from '@/components/DonationDetails';
import ReviewOrder from './ReviewOrder';
import PendingDonationsSection from './notifications/PendingDonationsSection';
import PendingDeliveriesSection from './notifications/PendingDeliveriesSection';
import ReservedDonationsSection from './notifications/ReservedDonationsSection';
import RequestedEquipmentSection from './notifications/RequestedEquipmentSection';
import PendingUsersSection from './notifications/PendingUsersSection';
import CustomTabPanel from './CustomTabPanel';
import { Tab, Tabs, Typography, useMediaQuery, Button, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

// Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Dashboard.module.css';

// Types
import { NotificationData } from '@/types/NotificationTypes';
import { Donation } from '@/models/donation';

type NotificationsProps = {
    notifications: NotificationData;
    refreshNotifications?: () => void;
};

export const RefreshNotificationsContext = createContext<() => void>(() => {});

/**
 * Groups donations by bulkCollection ID.
 * Treats donations with no bulkCollection ID as their own group key.
 * Returns an array of objects with the bulkCollection ID as the key and the array of donationss with that bulkCollection ID as the value.
 */
const sortArrayByBulkId = (array: Donation[]): { key: string; donations: Donation[] }[] => {
    const grouped = array.reduce(
        (acc, item) => {
            const key = item.bulkCollection ?? item.id;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        },
        {} as Record<string, Donation[]>
    );
    return Object.entries(grouped).map(([key, donations]) => ({
        key,
        donations
    }));
};

const notificationTabs = ['Pending Approval', 'Pending Deliveries', 'Reserved', 'Requested', 'Pending Users'];

const Notifications = ({ notifications: notifData, refreshNotifications }: NotificationsProps) => {
    const [data, setData] = useState<NotificationData>(notifData);
    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [userIdToDisplay, setUserIdToDisplay] = useState<string | null>(null);
    const [orderIdToDisplay, setOrderIdToDisplay] = useState<string | null>(null);
    const [currentTab, setCurrentTab] = useState<number>(0);

    useEffect(() => {
        setData(notifData);
    }, [notifData]);

    // Pre-sort data — filtering already done server-side via Firestore query.
    const donationsAwaitingApproval = data.donations.filter((d) => d.status === 'in processing');
    const sortedDonationsWaitingApproval = sortArrayByBulkId(donationsAwaitingApproval);
    const donationsAwaitingDropoff = data.donations.filter((d) => d.status === 'pending delivery');
    const sortedDonationsAwaitingDropoff = sortArrayByBulkId(donationsAwaitingDropoff);
    const donationsAwaitingPickup = data.donations.filter((d) => d.status === 'reserved');
    const sortedDonationsAwaitingPickup = sortArrayByBulkId(donationsAwaitingPickup);
    const orders = data.orders;
    const usersAwaitingApproval = data.users.filter((user) => !user.isDeleted);

    // Mobile sub-tab menu
    const matches = useMediaQuery('(min-width:600px)');
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => setCurrentTab(newValue);

    const hasNotifications = data.donations.length > 0 || data.orders.length > 0 || data.users.length > 0;

    return (
        <RefreshNotificationsContext.Provider value={refreshNotifications || (() => {})}>
            <ProtectedAdminRoute>
            {donationIdToDisplay && <DonationDetails id={donationIdToDisplay} setIdToDisplay={setDonationIdToDisplay} />}
            {userIdToDisplay && <UserDetails id={userIdToDisplay} setIdToDisplay={setUserIdToDisplay} />}
            {orderIdToDisplay && <ReviewOrder id={orderIdToDisplay} setIdToDisplay={setOrderIdToDisplay} />}
            {!donationIdToDisplay && !userIdToDisplay && !orderIdToDisplay && (
                <>
                    {!hasNotifications ? (
                        <Typography sx={{ marginTop: '1rem' }} variant="body1">
                            No new notifications at this time.
                        </Typography>
                    ) : (
                        <>
                            <div className={styles['sub-navbar']}>
                                {matches ? (
                                    <Tabs
                                        value={currentTab}
                                        onChange={handleTabChange}
                                        aria-label="notifications"
                                        variant="scrollable"
                                        scrollButtons="auto"
                                        sx={{
                                            flex: 1,
                                            minHeight: 44,
                                            '& .MuiTab-root': {
                                                color: '#888',
                                                fontWeight: 500,
                                                textTransform: 'none',
                                                fontSize: '0.8125rem',
                                                minHeight: 44,
                                                padding: '8px 14px',
                                                '&.Mui-selected': { color: '#333', fontWeight: 600 }
                                            },
                                            '& .MuiTabs-indicator': {
                                                height: 2,
                                                borderRadius: '2px 2px 0 0',
                                                backgroundColor: '#333'
                                            }
                                        }}
                                    >
                                        {notificationTabs.map((tab) => (
                                            <Tab key={tab} label={tab} />
                                        ))}
                                    </Tabs>
                                ) : (
                                    <>
                                        <Button
                                            endIcon={<ArrowDropDownIcon />}
                                            onClick={(e) => setAnchorEl(e.currentTarget)}
                                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', color: '#333' }}
                                        >
                                            {notificationTabs[currentTab]}
                                        </Button>
                                        <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
                                            {notificationTabs.map((tab, i) => (
                                                <MenuItem
                                                    key={tab}
                                                    selected={i === currentTab}
                                                    onClick={() => {
                                                        setCurrentTab(i);
                                                        setAnchorEl(null);
                                                    }}
                                                >
                                                    {tab}
                                                </MenuItem>
                                            ))}
                                        </Menu>
                                    </>
                                )}
                            </div>

                            <CustomTabPanel value={currentTab} index={0}>
                                <PendingDonationsSection
                                    donations={sortedDonationsWaitingApproval}
                                    setIdToDisplay={setDonationIdToDisplay}
                                />
                            </CustomTabPanel>
                            <CustomTabPanel value={currentTab} index={1}>
                                <PendingDeliveriesSection
                                    donations={sortedDonationsAwaitingDropoff}
                                    setIdToDisplay={setDonationIdToDisplay}
                                />
                            </CustomTabPanel>
                            <CustomTabPanel value={currentTab} index={2}>
                                <ReservedDonationsSection
                                    donations={sortedDonationsAwaitingPickup}
                                    setIdToDisplay={setDonationIdToDisplay}
                                />
                            </CustomTabPanel>
                            <CustomTabPanel value={currentTab} index={3}>
                                <RequestedEquipmentSection
                                    orders={orders}
                                    setIdToDisplay={setDonationIdToDisplay}
                                    setOrderIdToDisplay={setOrderIdToDisplay}
                                />
                            </CustomTabPanel>
                            <CustomTabPanel value={currentTab} index={4}>
                                <PendingUsersSection users={usersAwaitingApproval} setIdToDisplay={setUserIdToDisplay} />
                            </CustomTabPanel>
                        </>
                    )}
                </>
            )}
        </ProtectedAdminRoute>
    </RefreshNotificationsContext.Provider>
    );
};

export default Notifications;
