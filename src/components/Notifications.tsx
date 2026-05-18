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
//Types
import { Notification } from '@/types/NotificationTypes';
import { Donation } from '@/models/donation';
import { Order } from '@/types/OrdersTypes';

type NotificationsProps = {
    notifications: Notification;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
    activeSubTab?: number;
    onSubTabChange?: Dispatch<SetStateAction<number>>;
    highlightedEntityId?: string | null;
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
    orderGroups: RequestorOrderGroup[];
    totalItems: number;
};

type PickupRequestorGroup = {
    requestorName: string;
    requestorId: string;
    pickupGroups: PickupOrderGroup[];
    totalItems: number;
};

type RequestorOrderGroup = {
    dateKey: string;
    date: Date | null;
    orders: Order[];
    totalItems: number;
};

type PickupOrderGroup = {
    dateKey: string;
    date: Date | null;
    donations: Donation[];
    totalItems: number;
};

type DateLike = { toMillis?: () => number; toDate?: () => Date } | Date | string | null | undefined;

const toDateValue = (date: DateLike): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') {
        const parsed = new Date(date);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (date.toMillis) return new Date(date.toMillis());
    if (date.toDate) return date.toDate();
    return null;
};

const formatShortDate = (date: DateLike): string => {
    return toDateValue(date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? '';
};

const formatGroupDate = (date: DateLike): string => formatShortDate(date) || 'Unknown date';

const getDateTime = (date: DateLike): number => toDateValue(date)?.getTime() ?? Number.MAX_SAFE_INTEGER;

const getDateKey = (date: DateLike): string => toDateValue(date)?.toISOString().slice(0, 10) ?? 'unknown-date';

const compareNames = (a: string, b: string): number => a.localeCompare(b, undefined, { sensitivity: 'base' });

const compareDates = (a: DateLike, b: DateLike): number => getDateTime(a) - getDateTime(b);

const compareDonationName = (a: Donation, b: Donation): number => {
    const aName = `${a.brand ?? ''} ${a.model ?? ''}`.trim();
    const bName = `${b.brand ?? ''} ${b.model ?? ''}`.trim();
    return compareNames(aName, bName) || compareNames(a.tagNumber ?? '', b.tagNumber ?? '') || compareNames(a.id, b.id);
};

const getEarliestDate = (datesToCompare: DateLike[]): Date | null => {
    const dates = datesToCompare.map((date) => toDateValue(date)).filter((date): date is Date => Boolean(date));
    if (dates.length === 0) return null;
    return new Date(Math.min(...dates.map((date) => date.getTime())));
};

const getSubmissionDate = (submission: Donation[]): Date | null => getEarliestDate(submission.map((donation) => donation.createdAt));

const getSubmissionKey = (submission: Donation[]): string => submission[0]?.bulkCollection || `standalone-${submission[0]?.id ?? 'unknown'}`;

const getOrderRequestedDate = (order: Order): Date | null => getEarliestDate(order.items.map((item) => item.dateRequested)) ?? toDateValue(order.createdAt);

const sortDonationsByName = (donations: Donation[]): Donation[] => [...donations].sort(compareDonationName);

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
        donorMap.get(donorId)!.submissions.push(sortDonationsByName(bulk));
    }

    return Array.from(donorMap.entries())
        .map(([donorId, data]) => {
            const submissions = [...data.submissions].sort(
                (a, b) => compareDates(getSubmissionDate(a), getSubmissionDate(b)) || compareNames(a[0]?.bulkCollection ?? '', b[0]?.bulkCollection ?? '')
            );
            return {
                donorId,
                donorName: data.donorName,
                donorEmail: data.donorEmail,
                submissions,
                totalItems: submissions.reduce((sum, s) => sum + s.length, 0),
            };
        })
        .sort((a, b) => compareNames(a.donorName, b.donorName) || compareDates(getSubmissionDate(a.submissions[0]), getSubmissionDate(b.submissions[0])));
};

const groupByRequestor = (orders: Order[]): RequestorGroup[] => {
    const map = new Map<string, { name: string; orders: Order[] }>();
    for (const order of orders) {
        const { id, name } = order.requestor;
        if (!map.has(id)) map.set(id, { name, orders: [] });
        map.get(id)!.orders.push(order);
    }

    return Array.from(map.entries())
        .map(([requestorId, data]) => {
            const orderDateMap = new Map<string, { date: Date | null; orders: Order[] }>();
            for (const order of data.orders) {
                const date = getOrderRequestedDate(order);
                const dateKey = getDateKey(date);
                if (!orderDateMap.has(dateKey)) orderDateMap.set(dateKey, { date, orders: [] });
                orderDateMap.get(dateKey)!.orders.push({
                    ...order,
                    items: sortDonationsByName(order.items)
                });
            }

            const orderGroups = Array.from(orderDateMap.entries())
                .map(([dateKey, group]) => ({
                    dateKey,
                    date: group.date,
                    orders: [...group.orders].sort((a, b) => compareDates(getOrderRequestedDate(a), getOrderRequestedDate(b)) || compareNames(a.id, b.id)),
                    totalItems: group.orders.reduce((sum, order) => sum + order.items.length, 0)
                }))
                .sort((a, b) => compareDates(a.date, b.date));

            return {
                requestorId,
                requestorName: data.name,
                orderGroups,
                totalItems: orderGroups.reduce((sum, group) => sum + group.totalItems, 0),
            };
        })
        .sort((a, b) => compareNames(a.requestorName, b.requestorName) || compareDates(a.orderGroups[0]?.date, b.orderGroups[0]?.date));
};

const groupReservedByRequestor = (donations: Donation[]): PickupRequestorGroup[] => {
    const map = new Map<string, { name: string; donations: Donation[] }>();

    for (const donation of donations) {
        const requestorId = donation.requestor?.id || `missing-requestor-${donation.id}`;
        const requestorName = donation.requestor?.name || 'Missing requestor';
        if (!map.has(requestorId)) map.set(requestorId, { name: requestorName, donations: [] });
        map.get(requestorId)!.donations.push(donation);
    }

    return Array.from(map.entries())
        .map(([requestorId, data]) => {
            const pickupDateMap = new Map<string, { date: Date | null; donations: Donation[] }>();
            for (const donation of data.donations) {
                const date = toDateValue(donation.dateRequested);
                const dateKey = getDateKey(donation.dateRequested);
                if (!pickupDateMap.has(dateKey)) pickupDateMap.set(dateKey, { date, donations: [] });
                pickupDateMap.get(dateKey)!.donations.push(donation);
            }

            const pickupGroups = Array.from(pickupDateMap.entries())
                .map(([dateKey, group]) => ({
                    dateKey,
                    date: group.date,
                    donations: sortDonationsByName(group.donations),
                    totalItems: group.donations.length
                }))
                .sort((a, b) => compareDates(a.date, b.date));

            return {
                requestorId,
                requestorName: data.name,
                pickupGroups,
                totalItems: pickupGroups.reduce((sum, group) => sum + group.totalItems, 0),
            };
        })
        .sort((a, b) => compareNames(a.requestorName, b.requestorName) || compareDates(a.pickupGroups[0]?.date, b.pickupGroups[0]?.date));
};

const Notifications = (props: NotificationsProps) => {
    const { notifications, setNotificationsUpdated, activeSubTab, onSubTabChange, highlightedEntityId } = props;

    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [userIdToDisplay, setUserIdToDisplay] = useState<string | null>(null);
    const [orderIdToDisplay, setOrderIdToDisplay] = useState<string | null>(null);
    const [localSubTab, setLocalSubTab] = useState<number>(0);
    const currentTab = activeSubTab ?? localSubTab;

    const handleSubTabChange = (nextTab: number) => {
        if (onSubTabChange) {
            onSubTabChange(nextTab);
            return;
        }

        setLocalSubTab(nextTab);
    };

    const donationsAwaitingApproval = notifications.donations.filter((donation) => donation.status === 'in processing');
    const donorGroupsApproval = groupByDonor(donationsAwaitingApproval);
    const donationsAwaitingDropoff = notifications.donations.filter((donation) => donation.status === 'pending delivery');
    const donorGroupsDelivery = groupByDonor(donationsAwaitingDropoff);
    const donationsAwaitingPickup = notifications.donations.filter((donation) => donation.status === 'reserved');
    const pickupGroups = groupReservedByRequestor(donationsAwaitingPickup);
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
                                onChange={(_, v) => handleSubTabChange(v)}
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
                                                            isHighlighted={highlightedEntityId === donation.id}
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
                                                        <Box key={getSubmissionKey(submission)}>
                                                            {si > 0 && <Divider />}
                                                            <Box sx={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                bgcolor: '#fafafa', px: 2, py: 0.75, borderBottom: '1px solid #f0f0f0',
                                                            }}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {`${formatGroupDate(getSubmissionDate(submission))} — ${submission.length} item${submission.length !== 1 ? 's' : ''}`}
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
                                                                    isHighlighted={highlightedEntityId === donation.id}
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

                            {/* Tab 1: Pending Delivery — grouped by donor and bulk submission */}
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
                                            {group.submissions.map((submission, submissionIndex) => (
                                                <Box key={getSubmissionKey(submission)}>
                                                    {submissionIndex > 0 && <Divider />}
                                                    <Box sx={{
                                                        bgcolor: '#fafafa',
                                                        px: 2,
                                                        py: 0.75,
                                                        borderBottom: '1px solid #f0f0f0',
                                                    }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {`${formatGroupDate(getSubmissionDate(submission))} — ${submission.length} item${submission.length !== 1 ? 's' : ''}`}
                                                        </Typography>
                                                    </Box>
                                                    {submission.map((donation) => (
                                                        <NotificationCard
                                                            key={donation.id}
                                                            donation={donation}
                                                            type="pending-delivery"
                                                            setIdToDisplay={setDonationIdToDisplay}
                                                            setNotificationsUpdated={setNotificationsUpdated}
                                                            isHighlighted={highlightedEntityId === donation.id}
                                                        />
                                                    ))}
                                                </Box>
                                            ))}
                                        </Paper>
                                    ))
                                ) : (
                                    <Typography sx={{ marginTop: '1rem' }} variant="body2" color="text.secondary">
                                        No donations awaiting delivery.
                                    </Typography>
                                )}
                            </CustomTabPanel>

                            {/* Tab 2: Requested — grouped by requestor, sub-grouped by request date and order */}
                            <CustomTabPanel value={currentTab} index={2}>
                                {requestorGroups.length > 0 ? (
                                    requestorGroups.map((group) => (
                                        <Paper key={group.requestorId} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                                            <Box sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0',
                                            }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {group.requestorName}
                                                    <Typography component="span" variant="body2" color="text.secondary">
                                                        {` — ${group.orderGroups.reduce((sum, orderGroup) => sum + orderGroup.orders.length, 0)} orders, ${group.totalItems} item${group.totalItems !== 1 ? 's' : ''}`}
                                                    </Typography>
                                                </Typography>
                                            </Box>
                                            {group.orderGroups.map((orderGroup, orderGroupIndex) => (
                                                <Box key={orderGroup.dateKey}>
                                                    {orderGroupIndex > 0 && <Divider />}
                                                    <Box sx={{
                                                        bgcolor: '#fafafa',
                                                        px: 2,
                                                        py: 0.75,
                                                        borderBottom: '1px solid #f0f0f0',
                                                    }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {`${formatGroupDate(orderGroup.date)} — ${orderGroup.orders.length} order${orderGroup.orders.length !== 1 ? 's' : ''}, ${orderGroup.totalItems} item${orderGroup.totalItems !== 1 ? 's' : ''}`}
                                                        </Typography>
                                                    </Box>
                                                    {orderGroup.orders.map((order, orderIndex) => (
                                                        <Box key={order.id}>
                                                            {orderIndex > 0 && <Divider />}
                                                            <Box sx={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                bgcolor: '#fff', px: 2, py: 0.75, borderBottom: '1px solid #f0f0f0',
                                                            }}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {`${order.items.length} item${order.items.length !== 1 ? 's' : ''}`}
                                                                    {getOrderRequestedDate(order) && ` - ${formatShortDate(getOrderRequestedDate(order))}`}
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
                                                                    isHighlighted={highlightedEntityId === order.id || highlightedEntityId === item.id}
                                                                />
                                                            ))}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            ))}
                                        </Paper>
                                    ))
                                ) : (
                                    <Typography sx={{ marginTop: '1rem' }} variant="body2" color="text.secondary">
                                        No equipment requests.
                                    </Typography>
                                )}
                            </CustomTabPanel>

                            {/* Tab 3: Pending Pickup — grouped by requestor and request date so scheduled inventory selections stay together */}
                            <CustomTabPanel value={currentTab} index={3}>
                                {pickupGroups.length > 0 ? (
                                    pickupGroups.map((group) => (
                                        <Paper key={group.requestorId} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                                            <Box sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                bgcolor: '#f5f5f5', px: 2, py: 1, borderBottom: '1px solid #e0e0e0',
                                            }}>
                                                {donorHeader(group.requestorName, group.totalItems)}
                                            </Box>
                                            {group.pickupGroups.map((pickupGroup, pickupGroupIndex) => (
                                                <Box key={pickupGroup.dateKey}>
                                                    {pickupGroupIndex > 0 && <Divider />}
                                                    <Box sx={{
                                                        bgcolor: '#fafafa',
                                                        px: 2,
                                                        py: 0.75,
                                                        borderBottom: '1px solid #f0f0f0',
                                                    }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {`${formatGroupDate(pickupGroup.date)} — ${pickupGroup.totalItems} item${pickupGroup.totalItems !== 1 ? 's' : ''}`}
                                                        </Typography>
                                                    </Box>
                                                    {pickupGroup.donations.map((donation) => (
                                                        <NotificationCard
                                                            key={donation.id}
                                                            donation={donation}
                                                            type="reserved"
                                                            setIdToDisplay={setDonationIdToDisplay}
                                                            setNotificationsUpdated={setNotificationsUpdated}
                                                            isHighlighted={highlightedEntityId === donation.id}
                                                        />
                                                    ))}
                                                </Box>
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
                                            isHighlighted={highlightedEntityId === user.uid}
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
