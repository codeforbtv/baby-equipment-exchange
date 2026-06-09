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
import { Button, Chip, Paper, Tab, Tabs, Typography } from '@mui/material';
import CustomTabPanel from './CustomTabPanel';
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
    const [activeTab, setActiveTab] = useState<number>(0);

    const donationsAwaitingApproval = notifications.donations.filter((donation) => donation.status === 'in processing');
    const sortedDonationsWaitingApproval = sortArrayByBulkId(donationsAwaitingApproval);
    const donationsAwaitingDropoff = notifications.donations.filter((donation) => donation.status === 'pending delivery');
    const sortedDonationsAwaitingDropoff = sortArrayByBulkId(donationsAwaitingDropoff);
    const donationsAwaitingPickup = notifications.donations.filter((donation) => donation.status === 'reserved');
    const sortedDonationsAwaitingPickup = sortArrayByRequestor(donationsAwaitingPickup);
    const orders = notifications.orders;
    const usersAwaitingApproval = notifications.users.filter((user) => !user.isDeleted);

    const router = useRouter();

    const tabConfig = [
        { label: 'Pending Approval', count: donationsAwaitingApproval.length },
        { label: 'Pending Delivery', count: donationsAwaitingDropoff.length },
        { label: 'Requested', count: orders.length },
        { label: 'Pending Pickup', count: donationsAwaitingPickup.length },
        { label: 'Pending Users', count: usersAwaitingApproval.length },
    ];

    const tabLabel = (label: string, count: number) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}
            <Chip
                label={count}
                size="small"
                sx={{
                    bgcolor: count > 0 ? '#d32f2f' : '#bdbdbd',
                    color: 'white',
                    fontWeight: 600,
                    height: 20,
                    minWidth: 20,
                    '& .MuiChip-label': { px: 0.75 },
                }}
            />
        </span>
    );

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
                            <Tabs
                                value={activeTab}
                                onChange={(_, newValue) => setActiveTab(newValue)}
                                aria-label="notifications"
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{ marginTop: '1rem' }}
                            >
                                {tabConfig.map((tab, i) => (
                                    <Tab key={i} label={tabLabel(tab.label, tab.count)} sx={{ color: 'black' }} />
                                ))}
                            </Tabs>

                            <CustomTabPanel value={activeTab} index={0}>
                                {sortedDonationsWaitingApproval.length > 0 ? (
                                    sortedDonationsWaitingApproval.map((donationArray, i) => (
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
                                    ))
                                ) : (
                                    <Typography sx={{ marginTop: '1rem' }} variant="body1">
                                        No donations pending approval.
                                    </Typography>
                                )}
                            </CustomTabPanel>

                            <CustomTabPanel value={activeTab} index={1}>
                                {sortedDonationsAwaitingDropoff.length > 0 ? (
                                    sortedDonationsAwaitingDropoff.map((donationArray, i) => (
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
                                    ))
                                ) : (
                                    <Typography sx={{ marginTop: '1rem' }} variant="body1">
                                        No donations pending delivery.
                                    </Typography>
                                )}
                            </CustomTabPanel>

                            <CustomTabPanel value={activeTab} index={2}>
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <Paper className={styles['notification-card--container']} key={order.id} elevation={3}>
                                            <Typography variant="h6">{`${order.requestor.name} has requested the following items:`}</Typography>
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
                                    ))
                                ) : (
                                    <Typography sx={{ marginTop: '1rem' }} variant="body1">
                                        No requested equipment.
                                    </Typography>
                                )}
                            </CustomTabPanel>

                            <CustomTabPanel value={activeTab} index={3}>
                                {sortedDonationsAwaitingPickup.length > 0 ? (
                                    sortedDonationsAwaitingPickup.map((donationArray, i) => (
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
                                    ))
                                ) : (
                                    <Typography sx={{ marginTop: '1rem' }} variant="body1">
                                        No donations pending pickup.
                                    </Typography>
                                )}
                            </CustomTabPanel>

                            <CustomTabPanel value={activeTab} index={4}>
                                {usersAwaitingApproval.length > 0 ? (
                                    usersAwaitingApproval.map((user) => (
                                        <NotificationCard
                                            key={user.uid}
                                            type="pending-user"
                                            user={user}
                                            setIdToDisplay={setUserIdToDisplay}
                                            setNotificationsUpdated={setNotificationsUpdated}
                                        />
                                    ))
                                ) : (
                                    <Typography sx={{ marginTop: '1rem' }} variant="body1">
                                        No users pending approval.
                                    </Typography>
                                )}
                            </CustomTabPanel>
                        </>
                    )}
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default Notifications;
