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
import CustomTabPanel from './CustomTabPanel';
import { Box, Button, Chip, Paper, Tab, Tabs, Typography } from '@mui/material';
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
    const [currentTab, setCurrentTab] = useState<number>(0);

    const donationsAwaitingApproval = notifications.donations.filter((donation) => donation.status === 'in processing');
    const sortedDonationsWaitingApproval = sortArrayByBulkId(donationsAwaitingApproval);
    const donationsAwaitingDropoff = notifications.donations.filter((donation) => donation.status === 'pending delivery');
    const sortedDonationsAwaitingDropoff = sortArrayByBulkId(donationsAwaitingDropoff);
    const donationsAwaitingPickup = notifications.donations.filter((donation) => donation.status === 'reserved');
    const sortedDonationsAwaitingPickup = sortArrayByBulkId(donationsAwaitingPickup);
    const orders = notifications.orders.filter((order) => order.items.length > 0);
    const sortedOrders = [...orders].sort((a, b) =>
        a.requestor.name.localeCompare(b.requestor.name)
    );
    const usersAwaitingApproval = notifications.users.filter((user) => !user.isDeleted);

    const router = useRouter();

    const tabConfig = [
        { label: 'Pending Approval', count: donationsAwaitingApproval.length },
        { label: 'Pending Delivery', count: donationsAwaitingDropoff.length },
        { label: 'Requested', count: sortedOrders.length },
        { label: 'Pending Pickup', count: donationsAwaitingPickup.length },
        { label: 'Pending Users', count: usersAwaitingApproval.length },
    ];

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
                                value={currentTab}
                                onChange={(_, v) => setCurrentTab(v)}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    minHeight: 40,
                                    '& .MuiTab-root': {
                                        textTransform: 'none',
                                        fontSize: '0.8125rem',
                                        fontWeight: 500,
                                        minHeight: 40,
                                        py: 0.5,
                                    },
                                    '& .Mui-selected': { color: '#3d9991' },
                                    '& .MuiTabs-indicator': { backgroundColor: '#3d9991' },
                                }}
                            >
                                {tabConfig.map((tab) => (
                                    <Tab
                                        key={tab.label}
                                        label={
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {tab.label}
                                                <Chip
                                                    label={tab.count}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        minWidth: 20,
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 700,
                                                        bgcolor: tab.count > 0 ? '#a8351b' : '#e0e0e0',
                                                        color: tab.count > 0 ? '#fff' : '#757575',
                                                    }}
                                                />
                                            </span>
                                        }
                                    />
                                ))}
                            </Tabs>

                            <CustomTabPanel value={currentTab} index={0}>
                                {sortedDonationsWaitingApproval.length > 0 ? (
                                    sortedDonationsWaitingApproval.map((donationArray, i) => (
                                        <Paper key={i} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                                            <Box sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0',
                                            }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {donationArray[0].donorName}
                                                    <Typography component="span" variant="body2" color="text.secondary">
                                                        {` — ${donationArray.length} item${donationArray.length !== 1 ? 's' : ''}`}
                                                    </Typography>
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() => router.push(`/accept/${donationArray[0].bulkCollection}`)}
                                                >
                                                    Review
                                                </Button>
                                            </Box>
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
                                    ))
                                ) : (
                                    <Typography sx={{ marginTop: '1rem' }} variant="body2" color="text.secondary">
                                        No donations awaiting approval.
                                    </Typography>
                                )}
                            </CustomTabPanel>

                            <CustomTabPanel value={currentTab} index={1}>
                                {sortedDonationsAwaitingDropoff.length > 0 ? (
                                    sortedDonationsAwaitingDropoff.map((donationArray, i) => (
                                        <Paper key={i} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                                            <Box sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0',
                                            }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {donationArray[0].donorName}
                                                    <Typography component="span" variant="body2" color="text.secondary">
                                                        {` — ${donationArray.length} item${donationArray.length !== 1 ? 's' : ''}`}
                                                    </Typography>
                                                </Typography>
                                            </Box>
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
                                    <Typography sx={{ marginTop: '1rem' }} variant="body2" color="text.secondary">
                                        No donations awaiting delivery.
                                    </Typography>
                                )}
                            </CustomTabPanel>

                            <CustomTabPanel value={currentTab} index={2}>
                                {sortedOrders.length > 0 ? (
                                    sortedOrders.map((order) => (
                                        <Paper key={order.id} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                                            <Box sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0',
                                            }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {order.requestor.name}
                                                    <Typography component="span" variant="body2" color="text.secondary">
                                                        {` — ${order.items.length} item${order.items.length !== 1 ? 's' : ''}`}
                                                    </Typography>
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() => setOrderIdToDisplay(order.id)}
                                                >
                                                    Review
                                                </Button>
                                            </Box>
                                            {order.items.map((item) => (
                                                <NotificationCard
                                                    key={item.id}
                                                    type="order"
                                                    donation={item}
                                                    setIdToDisplay={setDonationIdToDisplay}
                                                    setNotificationsUpdated={setNotificationsUpdated}
                                                />
                                            ))}
                                        </Paper>
                                    ))
                                ) : (
                                    <Typography sx={{ marginTop: '1rem' }} variant="body2" color="text.secondary">
                                        No equipment requests.
                                    </Typography>
                                )}
                            </CustomTabPanel>

                            <CustomTabPanel value={currentTab} index={3}>
                                {sortedDonationsAwaitingPickup.length > 0 ? (
                                    sortedDonationsAwaitingPickup.map((donationArray, i) => (
                                        <Paper key={i} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                                            <Box sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0',
                                            }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {donationArray[0].donorName}
                                                    <Typography component="span" variant="body2" color="text.secondary">
                                                        {` — ${donationArray.length} item${donationArray.length !== 1 ? 's' : ''}`}
                                                    </Typography>
                                                </Typography>
                                            </Box>
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
                                    <Typography sx={{ marginTop: '1rem' }} variant="body2" color="text.secondary">
                                        No donations awaiting pickup.
                                    </Typography>
                                )}
                            </CustomTabPanel>

                            <CustomTabPanel value={currentTab} index={4}>
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
                                    <Typography sx={{ marginTop: '1rem' }} variant="body2" color="text.secondary">
                                        No users awaiting approval.
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
