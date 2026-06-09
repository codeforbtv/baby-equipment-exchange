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
import { Box, Button, Chip, Divider, Paper, Tab, Tabs, Typography } from '@mui/material';
import CustomTabPanel from './CustomTabPanel';
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

type DonorNameGroup = {
    displayName: string;
    submissions: Donation[][];
    totalItems: number;
};

type DonorGroup = {
    donorEmail: string;
    nameGroups: DonorNameGroup[];
    totalItems: number;
};

type RequestorGroup = {
    requestorName: string;
    requestorId: string;
    orders: Order[];
    totalItems: number;
};

const toTitleCase = (s: string) =>
    s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const groupByDonor = (donations: Donation[]): DonorGroup[] => {
    const emailMap = new Map<string, {
        rawEmail: string;
        names: Map<string, { displayName: string; bulks: Map<string, Donation[]> }>;
    }>();

    for (const d of donations) {
        const normalizedEmail = (d.donorEmail ?? '').trim().toLowerCase();
        const emailKey = normalizedEmail || `name:${(d.donorName ?? '').trim().toLowerCase()}`;

        let emailGroup = emailMap.get(emailKey);
        if (!emailGroup) {
            emailGroup = { rawEmail: d.donorEmail ?? '', names: new Map() };
            emailMap.set(emailKey, emailGroup);
        }

        const nameKey = (d.donorName ?? '').trim().toLowerCase();
        let nameGroup = emailGroup.names.get(nameKey);
        if (!nameGroup) {
            nameGroup = { displayName: toTitleCase(d.donorName ?? '') || 'Unknown Donor', bulks: new Map() };
            emailGroup.names.set(nameKey, nameGroup);
        }

        let bulk = nameGroup.bulks.get(d.bulkCollection);
        if (!bulk) {
            bulk = [];
            nameGroup.bulks.set(d.bulkCollection, bulk);
        }
        bulk.push(d);
    }

    return Array.from(emailMap.values())
        .map(({ rawEmail, names }) => {
            const nameGroups = Array.from(names.values())
                .map(({ displayName, bulks }) => ({
                    displayName,
                    submissions: Array.from(bulks.values()),
                    totalItems: Array.from(bulks.values()).reduce((sum, b) => sum + b.length, 0),
                }))
                .sort((a, b) => a.displayName.localeCompare(b.displayName));

            return {
                donorEmail: rawEmail,
                nameGroups,
                totalItems: nameGroups.reduce((sum, ng) => sum + ng.totalItems, 0),
            };
        })
        .sort((a, b) => a.nameGroups[0].displayName.localeCompare(b.nameGroups[0].displayName));
};

const groupByRequestor = (orders: Order[]): RequestorGroup[] => {
    const reqMap = new Map<string, { name: string; orders: Order[] }>();
    for (const o of orders) {
        let req = reqMap.get(o.requestor.id);
        if (!req) {
            req = { name: o.requestor.name, orders: [] };
            reqMap.set(o.requestor.id, req);
        }
        req.orders.push(o);
    }
    return Array.from(reqMap.entries())
        .map(([requestorId, { name, orders }]) => ({
            requestorId,
            requestorName: name,
            orders,
            totalItems: orders.reduce((sum, o) => sum + o.items.length, 0),
        }))
        .sort((a, b) => a.requestorName.localeCompare(b.requestorName));
};

const Notifications = (props: NotificationsProps) => {
    const { notifications, setNotificationsUpdated } = props;

    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [userIdToDisplay, setUserIdToDisplay] = useState<string | null>(null);
    const [orderIdToDisplay, setOrderIdToDisplay] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<number>(0);

    const donationsAwaitingApproval = notifications.donations.filter((d) => d.status === 'in processing');
    const donorGroupsApproval = groupByDonor(donationsAwaitingApproval);
    const donationsAwaitingDropoff = notifications.donations.filter((d) => d.status === 'pending delivery');
    const donorGroupsDelivery = groupByDonor(donationsAwaitingDropoff);
    const donationsAwaitingPickup = notifications.donations.filter((d) => d.status === 'reserved');
    const donorGroupsPickup = groupByDonor(donationsAwaitingPickup);
    const orders = notifications.orders;
    const requestorGroups = groupByRequestor(orders);
    const usersAwaitingApproval = notifications.users.filter((user) => !user.isDeleted);

    const router = useRouter();

    const itemCount = (n: number) => `${n} item${n !== 1 ? 's' : ''}`;

    const emailHeader = (email: string, count: number) => (
        <Typography variant="body2" fontWeight={600}>
            {email || 'No email'}
            <Typography component="span" variant="body2" color="text.secondary">
                {` — ${itemCount(count)}`}
            </Typography>
        </Typography>
    );

    const donorHeader = (group: DonorGroup) => {
        if (group.nameGroups.length === 1) {
            return (
                <Typography variant="body2" fontWeight={600}>
                    {group.nameGroups[0].displayName}
                    <Typography component="span" variant="body2" color="text.secondary">
                        {group.donorEmail ? ` (${group.donorEmail})` : ''}{` — ${itemCount(group.totalItems)}`}
                    </Typography>
                </Typography>
            );
        }
        return emailHeader(group.donorEmail, group.totalItems);
    };

    const nameSubHeader = (name: string, count: number) => (
        <Typography variant="body2" fontWeight={500}>
            {name}
            <Typography component="span" variant="body2" color="text.secondary">
                {` — ${itemCount(count)}`}
            </Typography>
        </Typography>
    );

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
                                {donorGroupsApproval.length > 0 ? (
                                    donorGroupsApproval.map((group, gi) => (
                                        <Paper key={gi} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                                            <Box sx={{ bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0' }}>
                                                {donorHeader(group)}
                                            </Box>
                                            {group.nameGroups.map((ng, ni) => (
                                                <Box key={ni}>
                                                    {group.nameGroups.length > 1 && (
                                                        <>
                                                            {ni > 0 && <Divider />}
                                                            <Box sx={{ bgcolor: '#fafafa', px: 2, py: 0.75, borderBottom: '1px solid #f0f0f0' }}>
                                                                {nameSubHeader(ng.displayName, ng.totalItems)}
                                                            </Box>
                                                        </>
                                                    )}
                                                    {ng.submissions.length === 1 ? (
                                                        <Box sx={{ p: 1 }}>
                                                            {ng.submissions[0].map((donation) => (
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
                                                                onClick={() => router.push(`/accept/${ng.submissions[0][0].bulkCollection}`)}
                                                            >
                                                                Review
                                                            </Button>
                                                        </Box>
                                                    ) : (
                                                        ng.submissions.map((submission, si) => (
                                                            <Box key={si}>
                                                                {si > 0 && <Divider />}
                                                                <Box sx={{ bgcolor: '#fafafa', px: 2, py: 0.5, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Submission {si + 1} — {itemCount(submission.length)}
                                                                    </Typography>
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        onClick={() => router.push(`/accept/${submission[0].bulkCollection}`)}
                                                                    >
                                                                        Review
                                                                    </Button>
                                                                </Box>
                                                                <Box sx={{ p: 1 }}>
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
                                                            </Box>
                                                        ))
                                                    )}
                                                </Box>
                                            ))}
                                        </Paper>
                                    ))
                                ) : (
                                    <Typography sx={{ marginTop: '1rem' }} variant="body1">
                                        No donations pending approval.
                                    </Typography>
                                )}
                            </CustomTabPanel>

                            <CustomTabPanel value={activeTab} index={1}>
                                {donorGroupsDelivery.length > 0 ? (
                                    donorGroupsDelivery.map((group, gi) => (
                                        <Paper key={gi} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                                            <Box sx={{ bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0' }}>
                                                {donorHeader(group)}
                                            </Box>
                                            {group.nameGroups.map((ng, ni) => (
                                                <Box key={ni}>
                                                    {group.nameGroups.length > 1 && (
                                                        <>
                                                            {ni > 0 && <Divider />}
                                                            <Box sx={{ bgcolor: '#fafafa', px: 2, py: 0.75, borderBottom: '1px solid #f0f0f0' }}>
                                                                {nameSubHeader(ng.displayName, ng.totalItems)}
                                                            </Box>
                                                        </>
                                                    )}
                                                    <Box sx={{ p: 1 }}>
                                                        {ng.submissions.flat().map((donation) => (
                                                            <NotificationCard
                                                                key={donation.id}
                                                                donation={donation}
                                                                type="pending-delivery"
                                                                setIdToDisplay={setDonationIdToDisplay}
                                                                setNotificationsUpdated={setNotificationsUpdated}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>
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
                                {requestorGroups.length > 0 ? (
                                    requestorGroups.map((group) => (
                                        <Paper key={group.requestorId} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                                            <Box sx={{ bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0' }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {group.requestorName}
                                                    <Typography component="span" variant="body2" color="text.secondary">
                                                        {` — ${group.totalItems} item${group.totalItems !== 1 ? 's' : ''}`}
                                                    </Typography>
                                                </Typography>
                                            </Box>
                                            {group.orders.length === 1 ? (
                                                <Box sx={{ p: 1 }}>
                                                    {group.orders[0].items.map((item) => (
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
                                                        onClick={() => setOrderIdToDisplay(group.orders[0].id)}
                                                    >
                                                        Review
                                                    </Button>
                                                </Box>
                                            ) : (
                                                group.orders.map((order, oi) => (
                                                    <Box key={order.id}>
                                                        {oi > 0 && <Divider />}
                                                        <Box sx={{ bgcolor: '#fafafa', px: 2, py: 0.75, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Order {oi + 1} — {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                                                {order.createdAt && ` · ${order.createdAt.toDate().toLocaleDateString()}`}
                                                            </Typography>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                onClick={() => setOrderIdToDisplay(order.id)}
                                                            >
                                                                Review
                                                            </Button>
                                                        </Box>
                                                        <Box sx={{ p: 1 }}>
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
                                                    </Box>
                                                ))
                                            )}
                                        </Paper>
                                    ))
                                ) : (
                                    <Typography sx={{ marginTop: '1rem' }} variant="body1">
                                        No requested equipment.
                                    </Typography>
                                )}
                            </CustomTabPanel>

                            <CustomTabPanel value={activeTab} index={3}>
                                {donorGroupsPickup.length > 0 ? (
                                    donorGroupsPickup.map((group, gi) => (
                                        <Paper key={gi} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                                            <Box sx={{ bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0' }}>
                                                {donorHeader(group)}
                                            </Box>
                                            {group.nameGroups.map((ng, ni) => (
                                                <Box key={ni}>
                                                    {group.nameGroups.length > 1 && (
                                                        <>
                                                            {ni > 0 && <Divider />}
                                                            <Box sx={{ bgcolor: '#fafafa', px: 2, py: 0.75, borderBottom: '1px solid #f0f0f0' }}>
                                                                {nameSubHeader(ng.displayName, ng.totalItems)}
                                                            </Box>
                                                        </>
                                                    )}
                                                    <Box sx={{ p: 1 }}>
                                                        {ng.submissions.flat().map((donation) => (
                                                            <NotificationCard
                                                                key={donation.id}
                                                                donation={donation}
                                                                type="reserved"
                                                                setIdToDisplay={setDonationIdToDisplay}
                                                                setNotificationsUpdated={setNotificationsUpdated}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>
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
