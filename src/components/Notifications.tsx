'use client';
//Hooks
import { Dispatch, SetStateAction, useState } from 'react';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import UserDetails from '@/components/UserDetails';
import DonationDetails from '@/components/DonationDetails';
import ReviewOrder from './ReviewOrder';
import NotificationCard from '@/components/NotificationCard';
import { Button, Paper, Typography } from '@mui/material';
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
                    {sortedDonationsWaitingApproval.length > 0 && (
                        <>
                            <Typography sx={{ marginTop: '1rem' }} variant="h6">
                                Donations requiring approval
                            </Typography>
                            {sortedDonationsWaitingApproval.map((donationArray, i) => (
                                <Paper className={styles['notification-card--container']} key={i} elevation={3}>
                                    {donationArray.map((donation) => (
                                        <NotificationCard
                                            key={donation.id}
                                            donation={donation}
                                            type="pending-donation"
                                            setIdToDisplay={setDonationIdToDisplay}
                                            setNotificationsUpdated={setNotificationsUpdated}
                                        />
                                    ))}
                                    <Button
                                        className={styles['notification-card--container--btn']}
                                        variant="contained"
                                        onClick={() => router.push(`/accept/${donationArray[0].bulkCollection}`)}
                                    >
                                        Review
                                    </Button>
                                </Paper>
                            ))}
                        </>
                    )}
                    {sortedDonationsAwaitingDropoff.length > 0 && (
                        <>
                            <Typography sx={{ marginTop: '1rem' }} variant="h6">
                                Donations waiting to be recieved
                            </Typography>
                            {sortedDonationsAwaitingDropoff.map((donationArray, i) => (
                                <Paper className={styles['notification-card--container']} key={i} elevation={3}>
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
                                <Paper className={styles['notification-card--container']} key={i} elevation={3}>
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
                            {orders.map((order) => (
                                <Paper className={styles['notification-card--container']} key={order.id} elevation={3}>
                                    <Typography variant="h6">{`${order.requestor.name} has requested the follwing items:`}</Typography>
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
                                    >
                                        Review
                                    </Button>
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
