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
import { Typography } from '@mui/material';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/NotificationCard.module.css';
//Types
import { Notification } from '@/types/NotificationTypes';
import { Donation } from '@/models/donation';
import { Storage } from '@/models/storage';
import { getActiveStorage } from '@/api/firebase-storage';
import { addErrorEvent } from '@/api/firebase';

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

const Notifications = (props: NotificationsProps) => {
    const { notifications, setNotificationsUpdated } = props;

    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [userIdToDisplay, setUserIdToDisplay] = useState<string | null>(null);
    const [orderIdToDisplay, setOrderIdToDisplay] = useState<string | null>(null);

    const donationsAwaitingApproval = notifications.donations.filter((donation) => donation.status === 'in processing');
    const sortedDonationsWaitingApproval = sortArrayByBulkId(donationsAwaitingApproval);
    const donationsAwaitingDropoff = notifications.donations.filter((donation) => donation.status === 'pending delivery');
    const sortedDonationsAwaitingDropoff = sortArrayByBulkId(donationsAwaitingDropoff);
    const donationsAwaitingPickup = notifications.donations.filter((donation) => donation.status === 'reserved');
    const sortedDonationsAwaitingPickup = sortArrayByRequestor(donationsAwaitingPickup);
    const groupedDonations = sortArrayByBulkId(notifications.donations);
    const orders = notifications.orders;
    const usersAwaitingApproval = notifications.users.filter((user) => !user.isDeleted); //Filters out recently deleted users

    const [activeStorageLocations, setActiveStorageLocations] = useState<Storage[]>([]);

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

    return (
        <ProtectedAdminRoute>
            {donationIdToDisplay && <DonationDetails id={donationIdToDisplay} setIdToDisplay={setDonationIdToDisplay} />}
            {userIdToDisplay && <UserDetails id={userIdToDisplay} setIdToDisplay={setUserIdToDisplay} />}
            {orderIdToDisplay && (
                <ReviewOrder
                    id={orderIdToDisplay}
                    // order={orders.find((o) => o.id === orderIdToDisplay)}
                    setIdToDisplay={setOrderIdToDisplay}
                    setNotificationsUpdated={setNotificationsUpdated}
                />
            )}
            {!donationIdToDisplay && !userIdToDisplay && !orderIdToDisplay && (
                <>
                    {notifications.donations.length === 0 && notifications.orders.length === 0 && notifications.users.length === 0 && (
                        <Typography sx={{ marginTop: '1rem' }} variant="body1">
                            No new notifications at this time.
                        </Typography>
                    )}
                    <PendingDonationsSection
                        donations={sortedDonationsWaitingApproval}
                        setIdToDisplay={setDonationIdToDisplay}
                        setNotificationsUpdated={setNotificationsUpdated}
                        activeStorageLocations={activeStorageLocations}
                    />
                    <PendingDeliveriesSection
                        donations={sortedDonationsAwaitingDropoff}
                        setIdToDisplay={setDonationIdToDisplay}
                        setNotificationsUpdated={setNotificationsUpdated}
                        activeStorageLocations={activeStorageLocations}
                    />
                    <ReservedDonationsSection
                        donations={sortedDonationsAwaitingPickup}
                        setIdToDisplay={setDonationIdToDisplay}
                        setNotificationsUpdated={setNotificationsUpdated}
                        activeStorageLocations={activeStorageLocations}
                    />
                    <RequestedEquipmentSection
                        orders={orders}
                        setIdToDisplay={setDonationIdToDisplay}
                        setOrderIdToDisplay={setOrderIdToDisplay}
                        setNotificationsUpdated={setNotificationsUpdated}
                        activeStorageLocations={activeStorageLocations}
                    />
                    <PendingStorageAssignmentSection
                        donations={groupedDonations}
                        activeStorageLocations={activeStorageLocations}
                        setIdToDisplay={setDonationIdToDisplay}
                        setNotificationsUpdated={setNotificationsUpdated}
                    />
                    <PendingUsersSection users={usersAwaitingApproval} setIdToDisplay={setUserIdToDisplay} setNotificationsUpdated={setNotificationsUpdated} />
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default Notifications;
