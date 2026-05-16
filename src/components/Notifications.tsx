'use client';
//Hooks
import { Dispatch, ReactNode, SetStateAction, useState } from 'react';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import UserDetails from '@/components/UserDetails';
import DonationDetails from '@/components/DonationDetails';
import ReviewOrder from './ReviewOrder';
import NotificationCard from '@/components/NotificationCard';
import { Box, Button, Paper, Typography } from '@mui/material';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/NotificationCard.module.css';
//Types
import { Notification } from '@/types/NotificationTypes';
import { Donation } from '@/models/donation';

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
    return Object.values(groupedByField).sort((a, b) => {
        const nameA = a[0]?.donorName || '';
        const nameB = b[0]?.donorName || '';
        return nameA.localeCompare(nameB);
    });
};

const sortArrayByDonorName = (array: Donation[]): Donation[][] => {
    const groupedByField = array.reduce(
        (acc, item) => {
            const sortByField = item.donorName;
            if (!acc[sortByField]) {
                acc[sortByField] = [];
            }
            acc[sortByField].push(item);
            return acc;
        },
        {} as Record<string, Donation[]>
    );
    return Object.values(groupedByField).sort((a, b) => {
        const nameA = a[0]?.donorName || '';
        const nameB = b[0]?.donorName || '';
        return nameA.localeCompare(nameB);
    });
};

const sortOrdersByRequestorName = (array: Notification['orders']): Notification['orders'][] => {
    const groupedByField = array.reduce(
        (acc, item) => {
            const sortByField = item.requestor ? item.requestor.name : '';
            if (!acc[sortByField]) {
                acc[sortByField] = [];
            }
            acc[sortByField].push(item);
            return acc;
        },
        {} as Record<string, Notification['orders']>
    );
    return Object.values(groupedByField).sort((a, b) => {
        const nameA = a[0]?.requestor?.name || '';
        const nameB = b[0]?.requestor?.name || '';
        return nameA.localeCompare(nameB);
    });
};

const itemCountLabel = (count: number) => `${count} item${count === 1 ? '' : 's'}`;

const donorGroupHeader = (donations: Donation[], action?: ReactNode) => {
    const donorName = donations[0]?.donorName || 'Unknown donor';

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                backgroundColor: '#f5f5f5',
                borderBottom: '1px solid #e0e0e0',
                padding: '0.5rem 1rem'
            }}
        >
            <Typography variant="body2" fontWeight={600}>
                {donorName}
                <Typography component="span" variant="body2" color="text.secondary">
                    {` — ${itemCountLabel(donations.length)}`}
                </Typography>
            </Typography>
            {action}
        </Box>
    );
};

const Notifications = (props: NotificationsProps) => {
    const { notifications, setNotificationsUpdated } = props;

    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [userIdToDisplay, setUserIdToDisplay] = useState<string | null>(null);
    const [orderIdToDisplay, setOrderIdToDisplay] = useState<string | null>(null);

    const donationsAwaitingApproval = notifications.donations.filter((donation) => donation.status === 'in processing');
    const sortedDonationsWaitingApproval = sortArrayByBulkId(donationsAwaitingApproval);
    const donationsAwaitingDropoff = notifications.donations.filter((donation) => donation.status === 'pending delivery');
    const sortedDonationsAwaitingDropoff = sortArrayByDonorName(donationsAwaitingDropoff);
    const donationsAwaitingPickup = notifications.donations.filter((donation) => donation.status === 'reserved');
    const sortedDonationsAwaitingPickup = sortArrayByDonorName(donationsAwaitingPickup);
    const orders = notifications.orders;
    const usersAwaitingApproval = notifications.users.filter((user) => !user.isDeleted); //Filters out recently deleted users

    const router = useRouter();

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
                    {sortedDonationsWaitingApproval.length > 0 && (
                        <>
                            <Typography sx={{ marginTop: '1rem' }} variant="h6">
                                Donations requiring approval
                            </Typography>
                            {sortedDonationsWaitingApproval.map((donationArray, i) => (
                                <Paper className={styles['notification-card--container']} key={i} variant="outlined">
                                    {donorGroupHeader(
                                        donationArray,
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => router.push(`/accept/${donationArray[0].bulkCollection}`)}
                                        >
                                            Review
                                        </Button>
                                    )}
                                    {donationArray.map((donation) => (
                                        <NotificationCard
                                            key={donation.id}
                                            donation={donation}
                                            type="pending-donation"
                                            setIdToDisplay={setDonationIdToDisplay}
                                            setNotificationsUpdated={setNotificationsUpdated}
                                        />
                                    ))}
                                </Paper>
                            ))}
                        </>
                    )}
                    {sortedDonationsAwaitingDropoff.length > 0 && (
                        <>
                            <Typography sx={{ marginTop: '1rem' }} variant="h6">
                                Donations waiting to be received
                            </Typography>
                            {sortedDonationsAwaitingDropoff.map((donationArray, i) => (
                                <Paper className={styles['notification-card--container']} key={i} variant="outlined">
                                    {donorGroupHeader(donationArray)}
                                    {donationArray.map((donation) => (
                                        <NotificationCard
                                            key={donation.id}
                                            donation={donation}
                                            type="pending-delivery"
                                            setIdToDisplay={setDonationIdToDisplay}
                                            setNotificationsUpdated={setNotificationsUpdated}
                                        />
                                    ))}
                                </Paper>
                            ))}
                        </>
                    )}
                    {sortedDonationsAwaitingPickup.length > 0 && (
                        <>
                            <Typography sx={{ marginTop: '1rem' }} variant="h6">
                                Donations waiting for pickup
                            </Typography>
                            {sortedDonationsAwaitingPickup.map((donationArray, i) => (
                                <Paper className={styles['notification-card--container']} key={i} variant="outlined">
                                    {donorGroupHeader(donationArray)}
                                    {donationArray.map((donation) => (
                                        <NotificationCard
                                            key={donation.id}
                                            donation={donation}
                                            type="reserved"
                                            setIdToDisplay={setDonationIdToDisplay}
                                            setNotificationsUpdated={setNotificationsUpdated}
                                        />
                                    ))}
                                </Paper>
                            ))}
                        </>
                    )}
                    {orders.length > 0 && (
                        <>
                            <Typography sx={{ marginTop: '1rem' }} variant="h6">
                                Requested Equipment
                            </Typography>
                            {sortOrdersByRequestorName(orders).map((orderArray, i) => (
                                <Paper className={styles['notification-card--container']} key={i} variant="outlined">
                                    <Typography variant="h6">{`${orderArray[0].requestor.name} has requested the following items:`}</Typography>
                                    {orderArray.map((order) => (
                                        <div key={order.id} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                            {order.items.map((item) => (
                                                <NotificationCard
                                                    key={item.id}
                                                    type="order"
                                                    donation={item}
                                                    setIdToDisplay={setDonationIdToDisplay}
                                                    setNotificationsUpdated={setNotificationsUpdated}
                                                />
                                            ))}
                                            <Button
                                                className={styles['notification-card--container--btn']}
                                                variant="contained"
                                                onClick={() => setOrderIdToDisplay(order.id)}
                                                sx={{ mb: orderArray.length > 1 ? 2 : 0 }}
                                            >
                                                Review
                                            </Button>
                                        </div>
                                    ))}
                                </Paper>
                            ))}
                        </>
                    )}
                    {usersAwaitingApproval.length > 0 && (
                        <>
                            <Typography sx={{ marginTop: '1rem' }} variant="h6">
                                Users awaiting approval
                            </Typography>
                            {usersAwaitingApproval.map((user) => (
                                <NotificationCard
                                    key={user.uid}
                                    type="pending-user"
                                    user={user}
                                    setIdToDisplay={setUserIdToDisplay}
                                    setNotificationsUpdated={setNotificationsUpdated}
                                />
                            ))}
                        </>
                    )}
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default Notifications;
