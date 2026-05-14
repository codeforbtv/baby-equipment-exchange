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
import { Box, Button, Chip, Divider, Paper, Tab, Tabs, Typography } from '@mui/material';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/NotificationCard.module.css';
//Types
import { Notification } from '@/types/NotificationTypes';
import { Donation } from '@/models/donation';
import { Order } from '@/types/OrdersTypes';

type NotificationsProps = {
    notifications: Notification;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

type DonorGroup = {
    donorName: string;
    donorEmail: string;
    donorId: string;
    submissions: Donation[][];
    totalItems: number;
};

type RequestorGroup = {
    requestorName: string;
    requestorId: string;
    orders: Order[];
    totalItems: number;
};

const groupByDonor = (donations: Donation[]): DonorGroup[] => {
    const bulkMap = new Map<string, Donation[]>();
    for (const d of donations) {
        const key = d.bulkCollection || `standalone-${d.id}`;
        if (!bulkMap.has(key)) bulkMap.set(key, []);
        bulkMap.get(key)!.push(d);
    }

    const donorMap = new Map<string, { donorName: string; donorEmail: string; submissions: Donation[][] }>();
    for (const bulk of bulkMap.values()) {
        const { donorId, donorName, donorEmail } = bulk[0];
        if (!donorMap.has(donorId)) {
            donorMap.set(donorId, { donorName, donorEmail, submissions: [] });
        }
        donorMap.get(donorId)!.submissions.push(bulk);
    }

    return Array.from(donorMap.entries())
        .map(([donorId, data]) => ({
            donorId,
            donorName: data.donorName,
            donorEmail: data.donorEmail,
            submissions: data.submissions,
            totalItems: data.submissions.reduce((sum, s) => sum + s.length, 0),
        }))
        .sort((a, b) => a.donorName.localeCompare(b.donorName));
};

const groupByRequestor = (orders: Order[]): RequestorGroup[] => {
    const map = new Map<string, { name: string; orders: Order[] }>();
    for (const order of orders) {
        const { id, name } = order.requestor;
        if (!map.has(id)) map.set(id, { name, orders: [] });
        map.get(id)!.orders.push(order);
    }

    return Array.from(map.entries())
        .map(([requestorId, data]) => ({
            requestorId,
            requestorName: data.name,
            orders: data.orders,
            totalItems: data.orders.reduce((sum, o) => sum + o.items.length, 0),
        }))
        .sort((a, b) => a.requestorName.localeCompare(b.requestorName));
};

const Notifications = (props: NotificationsProps) => {
    const { notifications, setNotificationsUpdated } = props;

    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [userIdToDisplay, setUserIdToDisplay] = useState<string | null>(null);
    const [orderIdToDisplay, setOrderIdToDisplay] = useState<string | null>(null);
    const [currentTab, setCurrentTab] = useState<number>(0);

    const donationsAwaitingApproval = notifications.donations.filter((donation) => donation.status === 'in processing');
    const donorGroupsApproval = groupByDonor(donationsAwaitingApproval);
    const donationsAwaitingDropoff = notifications.donations.filter((donation) => donation.status === 'pending delivery');
    const donorGroupsDelivery = groupByDonor(donationsAwaitingDropoff);
    const donationsAwaitingPickup = notifications.donations.filter((donation) => donation.status === 'reserved');
    const donorGroupsPickup = groupByDonor(donationsAwaitingPickup);
    const orders = notifications.orders.filter((order) => order.items.length > 0);
    const requestorGroups = groupByRequestor(orders);
    const usersAwaitingApproval = notifications.users.filter((user) => !user.isDeleted);

    const router = useRouter();

    const tabConfig = [
        { label: 'Pending Approval', count: donationsAwaitingApproval.length },
        { label: 'Pending Delivery', count: donationsAwaitingDropoff.length },
        { label: 'Requested', count: orders.length },
        { label: 'Pending Pickup', count: donationsAwaitingPickup.length },
        { label: 'Pending Users', count: usersAwaitingApproval.length },
    ];

    const donorHeader = (name: string, count: number) => (
        <Typography variant="body2" fontWeight={600}>
            {name}
            <Typography component="span" variant="body2" color="text.secondary">
                {` — ${count} item${count !== 1 ? 's' : ''}`}
            </Typography>
        </Typography>
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

                            {/* Tab 0: Pending Approval — grouped by donor, sub-grouped by bulk submission */}
                            <CustomTabPanel value={currentTab} index={0}>
                                {donorGroupsApproval.length > 0 ? (
                                    donorGroupsApproval.map((group) => (
                                        <Paper key={group.donorId} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                                            {group.submissions.length === 1 ? (
                                                <>
                                                    <Box sx={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0',
                                                    }}>
                                                        {donorHeader(group.donorName, group.totalItems)}
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            onClick={() => router.push(`/accept/${group.submissions[0][0].bulkCollection}`)}
                                                        >
                                                            Review
                                                        </Button>
                                                    </Box>
                                                    {group.submissions[0].map((donation) => (
                                                        <NotificationCard
                                                            key={donation.id}
                                                            donation={donation}
                                                            type="pending-donation"
                                                            setIdToDisplay={setDonationIdToDisplay}
                                                            setNotificationsUpdated={setNotificationsUpdated}
                                                        />
                                                    ))}
                                                </>
                                            ) : (
                                                <>
                                                    <Box sx={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0',
                                                    }}>
                                                        {donorHeader(group.donorName, group.totalItems)}
                                                    </Box>
                                                    {group.submissions.map((submission, si) => (
                                                        <Box key={submission[0].bulkCollection}>
                                                            {si > 0 && <Divider />}
                                                            <Box sx={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                bgcolor: '#fafafa', px: 2, py: 0.75, borderBottom: '1px solid #f0f0f0',
                                                            }}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {`${submission.length} item${submission.length !== 1 ? 's' : ''}`}
                                                                </Typography>
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    onClick={() => router.push(`/accept/${submission[0].bulkCollection}`)}
                                                                >
                                                                    Review
                                                                </Button>
                                                            </Box>
                                                            {submission.map((donation) => (
                                                                <NotificationCard
                                                                    key={donation.id}
                                                                    donation={donation}
                                                                    type="pending-donation"
                                                                    setIdToDisplay={setDonationIdToDisplay}
                                                                    setNotificationsUpdated={setNotificationsUpdated}
                                                                />
                                                            ))}
                                                        </Box>
                                                    ))}
                                                </>
                                            )}
                                        </Paper>
                                    ))
                                ) : (
                                    <Typography sx={{ marginTop: '1rem' }} variant="body2" color="text.secondary">
                                        No donations awaiting approval.
                                    </Typography>
                                )}
                            </CustomTabPanel>

                            {/* Tab 1: Pending Delivery — grouped by donor, flat card list */}
                            <CustomTabPanel value={currentTab} index={1}>
                                {donorGroupsDelivery.length > 0 ? (
                                    donorGroupsDelivery.map((group) => (
                                        <Paper key={group.donorId} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                                            <Box sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0',
                                            }}>
                                                {donorHeader(group.donorName, group.totalItems)}
                                            </Box>
                                            {group.submissions.flat().map((donation) => (
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

                            {/* Tab 2: Requested — grouped by requestor, sub-grouped by order */}
                            <CustomTabPanel value={currentTab} index={2}>
                                {requestorGroups.length > 0 ? (
                                    requestorGroups.map((group) => (
                                        <Paper key={group.requestorId} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                                            {group.orders.length === 1 ? (
                                                <>
                                                    <Box sx={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0',
                                                    }}>
                                                        {donorHeader(group.requestorName, group.totalItems)}
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            onClick={() => setOrderIdToDisplay(group.orders[0].id)}
                                                        >
                                                            Review
                                                        </Button>
                                                    </Box>
                                                    {group.orders[0].items.map((item) => (
                                                        <NotificationCard
                                                            key={item.id}
                                                            type="order"
                                                            donation={item}
                                                            setIdToDisplay={setDonationIdToDisplay}
                                                            setNotificationsUpdated={setNotificationsUpdated}
                                                        />
                                                    ))}
                                                </>
                                            ) : (
                                                <>
                                                    <Box sx={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0',
                                                    }}>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {group.requestorName}
                                                            <Typography component="span" variant="body2" color="text.secondary">
                                                                {` — ${group.orders.length} orders, ${group.totalItems} item${group.totalItems !== 1 ? 's' : ''}`}
                                                            </Typography>
                                                        </Typography>
                                                    </Box>
                                                    {group.orders.map((order, oi) => (
                                                        <Box key={order.id}>
                                                            {oi > 0 && <Divider />}
                                                            <Box sx={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                bgcolor: '#fafafa', px: 2, py: 0.75, borderBottom: '1px solid #f0f0f0',
                                                            }}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {`${order.items.length} item${order.items.length !== 1 ? 's' : ''}`}
                                                                    {order.createdAt && ` — ${order.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
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
                                                        </Box>
                                                    ))}
                                                </>
                                            )}
                                        </Paper>
                                    ))
                                ) : (
                                    <Typography sx={{ marginTop: '1rem' }} variant="body2" color="text.secondary">
                                        No equipment requests.
                                    </Typography>
                                )}
                            </CustomTabPanel>

                            {/* Tab 3: Pending Pickup — grouped by donor, flat card list */}
                            <CustomTabPanel value={currentTab} index={3}>
                                {donorGroupsPickup.length > 0 ? (
                                    donorGroupsPickup.map((group) => (
                                        <Paper key={group.donorId} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                                            <Box sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0',
                                            }}>
                                                {donorHeader(group.donorName, group.totalItems)}
                                            </Box>
                                            {group.submissions.flat().map((donation) => (
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

                            {/* Tab 4: Pending Users — no grouping */}
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
