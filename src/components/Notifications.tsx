'use client';
//Hooks
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import UserDetails from '@/components/UserDetails';
import DonationDetails from '@/components/DonationDetails';
import ReviewOrder from './ReviewOrder';
import PendingDonationsSection from './notifications/PendingDonationsSection';
import PendingDeliveriesSection from './notifications/PendingDeliveriesSection';
import ReservedDonationsSection from './notifications/ReservedDonationsSection';
import RequestedEquipmentSection from './notifications/RequestedEquipmentSection';
import PendingUsersSection from './notifications/PendingUsersSection';
import PendingStorageAssignmentSection from './notifications/PendingStorageAssignmentSection';
import CustomTabPanel from './CustomTabPanel';
import { Tab, Tabs, Typography, useMediaQuery, Button, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Dashboard.module.css';
//Types
import { Notification } from '@/types/NotificationTypes';
import { Donation } from '@/models/donation';
import { Storage } from '@/models/storage';
import { getActiveStorage } from '@/api/firebase-storage';
import { addErrorEvent } from '@/api/firebase';
import React from 'react';

type NotificationsProps = {
    notifications: Notification;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const sortArrayByBulkId = (array: Donation[]): Donation[][] => {
    const groupedByField = array.reduce(
        (acc, item) => {
            const sortByField = item.bulkCollection;
            if (!acc[sortByField]) {
                acc[sortByField] = [];
            }
            acc[sortByField].push(item);
            return acc;
        },
        {} as Record<string, Donation[]>
    );
    return Object.values(groupedByField);
};

const sortArrayByRequestor = (array: Donation[]): Donation[][] => {
    const groupedByField = array.reduce(
        (acc, item) => {
            const sortByField = item.requestor ? item.requestor.id : '';
            if (!acc[sortByField]) {
                acc[sortByField] = [];
            }
            acc[sortByField].push(item);
            return acc;
        },
        {} as Record<string, Donation[]>
    );
    return Object.values(groupedByField);
};

const notificationTabs = ['Pending Approval', 'Pending Delivery', 'Reserved', 'Requested', 'Storage Assignment', 'Pending Users'];

const Notifications = (props: NotificationsProps) => {
    const { notifications, setNotificationsUpdated } = props;

    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [userIdToDisplay, setUserIdToDisplay] = useState<string | null>(null);
    const [orderIdToDisplay, setOrderIdToDisplay] = useState<string | null>(null);
    const [currentTab, setCurrentTab] = useState<number>(0);

    const donationsAwaitingApproval = notifications.donations.filter((donation) => donation.status === 'in processing');
    const sortedDonationsWaitingApproval = sortArrayByBulkId(donationsAwaitingApproval);
    const donationsAwaitingDropoff = notifications.donations.filter((donation) => donation.status === 'pending delivery');
    const sortedDonationsAwaitingDropoff = sortArrayByBulkId(donationsAwaitingDropoff);
    const donationsAwaitingPickup = notifications.donations.filter((donation) => donation.status === 'reserved');
    const sortedDonationsAwaitingPickup = sortArrayByRequestor(donationsAwaitingPickup);
    const groupedDonations = sortArrayByBulkId(notifications.donations);
    const orders = notifications.orders;
    const usersAwaitingApproval = notifications.users.filter((user) => !user.isDeleted);

    const [activeStorageLocations, setActiveStorageLocations] = useState<Storage[]>([]);

    //for mobile sub-tab menu
    const matches = useMediaQuery('(min-width:600px)');
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    useEffect(() => {
        const fetchActiveStorage = async () => {
            try {
                const locations = await getActiveStorage();
                setActiveStorageLocations(locations);
            } catch (error) {
                addErrorEvent('Error fetching active storage locations', error);
            }
        };
        fetchActiveStorage();
    }, []);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    return (
        <ProtectedAdminRoute>
            {donationIdToDisplay && <DonationDetails id={donationIdToDisplay} setIdToDisplay={setDonationIdToDisplay} />}
            {userIdToDisplay && <UserDetails id={userIdToDisplay} setIdToDisplay={setUserIdToDisplay} />}
            {orderIdToDisplay && (
                <ReviewOrder
                    id={orderIdToDisplay}
                    setIdToDisplay={setOrderIdToDisplay}
                    setNotificationsUpdated={setNotificationsUpdated}
                />
            )}
            {!donationIdToDisplay && !userIdToDisplay && !orderIdToDisplay && (
                <>
                    {notifications.donations.length === 0 && notifications.orders.length === 0 && notifications.users.length === 0 ? (
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
                                    setNotificationsUpdated={setNotificationsUpdated}
                                    activeStorageLocations={activeStorageLocations}
                                />
                            </CustomTabPanel>
                            <CustomTabPanel value={currentTab} index={1}>
                                <PendingDeliveriesSection
                                    donations={sortedDonationsAwaitingDropoff}
                                    setIdToDisplay={setDonationIdToDisplay}
                                    setNotificationsUpdated={setNotificationsUpdated}
                                    activeStorageLocations={activeStorageLocations}
                                />
                            </CustomTabPanel>
                            <CustomTabPanel value={currentTab} index={2}>
                                <ReservedDonationsSection
                                    donations={sortedDonationsAwaitingPickup}
                                    setIdToDisplay={setDonationIdToDisplay}
                                    setNotificationsUpdated={setNotificationsUpdated}
                                    activeStorageLocations={activeStorageLocations}
                                />
                            </CustomTabPanel>
                            <CustomTabPanel value={currentTab} index={3}>
                                <RequestedEquipmentSection
                                    orders={orders}
                                    setIdToDisplay={setDonationIdToDisplay}
                                    setOrderIdToDisplay={setOrderIdToDisplay}
                                    setNotificationsUpdated={setNotificationsUpdated}
                                    activeStorageLocations={activeStorageLocations}
                                />
                            </CustomTabPanel>
                            <CustomTabPanel value={currentTab} index={4}>
                                <PendingStorageAssignmentSection
                                    donations={groupedDonations}
                                    activeStorageLocations={activeStorageLocations}
                                    setIdToDisplay={setDonationIdToDisplay}
                                    setNotificationsUpdated={setNotificationsUpdated}
                                />
                            </CustomTabPanel>
                            <CustomTabPanel value={currentTab} index={5}>
                                <PendingUsersSection
                                    users={usersAwaitingApproval}
                                    setIdToDisplay={setUserIdToDisplay}
                                    setNotificationsUpdated={setNotificationsUpdated}
                                />
                            </CustomTabPanel>
                        </>
                    )}
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default Notifications;
