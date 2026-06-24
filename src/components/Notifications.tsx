'use client';
//Hooks
import { Dispatch, SetStateAction, useState } from 'react';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import UserDetails from '@/components/UserDetails';
import DonationDetailsDialog from '@/components/DonationDetailsDialog';
import ReviewOrder from './ReviewOrder';
import NotificationCard from '@/components/NotificationCard';
import { Box, Button, Chip, InputAdornment, Paper, Tab, Tabs, TextField, Typography } from '@mui/material';
import CustomTabPanel from './CustomTabPanel';
//Icons
import SearchIcon from '@mui/icons-material/Search';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/NotificationCard.module.css';
//Types
import { Notification, ReservedOrderLink } from '@/types/NotificationTypes';
import { Donation } from '@/models/donation';
import { Order } from '@/types/OrdersTypes';
import { IUser } from '@/models/user';
import { Timestamp } from 'firebase/firestore';

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

const donationMatches = (d: Donation, q: string) =>
    [d.tagNumber, d.brand, d.model, d.category, d.donorName, d.donorEmail].some((v) => String(v ?? '').toLowerCase().includes(q));

const orderMatches = (o: Order, q: string) =>
    [o.requestor.name, o.requestor.email].some((v) => String(v ?? '').toLowerCase().includes(q)) || o.items.some((item) => donationMatches(item, q));

const userMatches = (u: IUser, q: string) =>
    [u.displayName, u.email, u.organization?.name].some((v) => String(v ?? '').toLowerCase().includes(q));

const STICKY_TOP: Record<number, string> = { 1: '7.5rem', 2: '10rem', 3: '12.25rem' };
const LEVEL_MIN_H: Record<number, string> = { 1: '2.5rem', 2: '2.25rem', 3: '2.25rem' };

// Container sx for a group header at the given nesting level.
const groupHeaderSx = (level: number) => ({
    position: 'sticky' as const,
    top: STICKY_TOP[level],
    zIndex: 5 - level, // level1=4, level2=3, level3=2; Tabs raised to 6
    minHeight: LEVEL_MIN_H[level],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 1,
    px: 2,
    py: level === 1 ? 1 : 0.75,
    ...(level === 1
        ? { bgcolor: '#00695c', color: '#fff', borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }
        : { bgcolor: level === 2 ? '#f0f4f3' : '#fafafa', borderBottom: '1px solid #e0e0e0' })
});

// Indent wrapper for a sub-group block (level >= 2). Nesting is shown by
// indentation + the sticky grey sub-headers; no left rail.
const railSx = (level: number) => ({ ml: level - 1 });

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

type PickupOrderBucket = { orderId: string; createdAt: Timestamp | null; items: Donation[] };
type RequestorPickupGroup = {
    requestorId: string;
    requestorName: string;
    requestorEmail: string;
    orders: PickupOrderBucket[];
    totalItems: number;
};

const groupReservedByRequestor = (donations: Donation[], links: ReservedOrderLink[]): RequestorPickupGroup[] => {
    const linkById = new Map(links.map((l) => [l.donationId, l]));
    const reqMap = new Map<string, { name: string; email: string; orders: Map<string, PickupOrderBucket> }>();

    for (const d of donations) {
        const reqId = d.requestor?.id ?? 'unknown';
        let req = reqMap.get(reqId);
        if (!req) {
            req = { name: d.requestor?.name ?? 'Unknown requester', email: d.requestor?.email ?? '', orders: new Map() };
            reqMap.set(reqId, req);
        }
        const link = linkById.get(d.id);
        // Fallback when no order link: bucket by request day so unlinked items still group sensibly.
        const orderKey = link?.orderId ?? `nolink:${d.dateRequested?.toMillis() ?? 'na'}`;
        let bucket = req.orders.get(orderKey);
        if (!bucket) {
            bucket = { orderId: orderKey, createdAt: link?.orderCreatedAt ?? d.dateRequested ?? null, items: [] };
            req.orders.set(orderKey, bucket);
        }
        bucket.items.push(d);
    }

    const millis = (t: Timestamp | null) => (t ? t.toMillis() : 0);
    return Array.from(reqMap.entries())
        .map(([requestorId, { name, email, orders }]) => {
            const buckets = Array.from(orders.values()).sort((a, b) => millis(a.createdAt) - millis(b.createdAt)); // Order 1 = oldest
            return {
                requestorId,
                requestorName: name,
                requestorEmail: email,
                orders: buckets,
                totalItems: buckets.reduce((sum, b) => sum + b.items.length, 0)
            };
        })
        .sort((a, b) => a.requestorName.localeCompare(b.requestorName));
};

const Notifications = (props: NotificationsProps) => {
    const { notifications, setNotificationsUpdated } = props;

    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [userIdToDisplay, setUserIdToDisplay] = useState<string | null>(null);
    const [orderIdToDisplay, setOrderIdToDisplay] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [searchInput, setSearchInput] = useState<string>('');

    const q = searchInput.trim().toLowerCase();

    const donationsAwaitingApproval = notifications.donations.filter((d) => d.status === 'in processing').filter((d) => !q || donationMatches(d, q));
    const donorGroupsApproval = groupByDonor(donationsAwaitingApproval);
    const donationsAwaitingDropoff = notifications.donations.filter((d) => d.status === 'pending delivery').filter((d) => !q || donationMatches(d, q));
    const donorGroupsDelivery = groupByDonor(donationsAwaitingDropoff);
    const donationsAwaitingPickup = notifications.donations.filter((d) => d.status === 'reserved').filter((d) => !q || donationMatches(d, q));
    const requestorPickupGroups = groupReservedByRequestor(donationsAwaitingPickup, notifications.reservedOrderLinks ?? []);
    const orders = notifications.orders.filter((o) => !q || orderMatches(o, q));
    const requestorGroups = groupByRequestor(orders);
    const usersAwaitingApproval = notifications.users.filter((user) => !user.isDeleted).filter((u) => !q || userMatches(u, q));

    const donationToDisplay = donationIdToDisplay
        ? ([...notifications.donations, ...notifications.orders.flatMap((o) => o.items)].find((d) => d.id === donationIdToDisplay) ?? null)
        : null;

    const router = useRouter();

    const itemCount = (n: number) => `${n} item${n !== 1 ? 's' : ''}`;

    const secondaryColor = (onTeal: boolean) => (onTeal ? 'rgba(255,255,255,0.75)' : 'text.secondary');

    const emailHeader = (email: string, count: number, onTeal = false) => (
        <Typography variant="body2" fontWeight={600}>
            {email || 'No email'}
            <Typography component="span" variant="body2" sx={{ color: secondaryColor(onTeal) }}>
                {` — ${itemCount(count)}`}
            </Typography>
        </Typography>
    );

    const donorHeader = (group: DonorGroup, onTeal = false) => {
        if (group.nameGroups.length === 1) {
            return (
                <Typography variant="body2" fontWeight={600}>
                    {group.nameGroups[0].displayName}
                    <Typography component="span" variant="body2" sx={{ color: secondaryColor(onTeal) }}>
                        {group.donorEmail ? ` (${group.donorEmail})` : ''}{` — ${itemCount(group.totalItems)}`}
                    </Typography>
                </Typography>
            );
        }
        return emailHeader(group.donorEmail, group.totalItems, onTeal);
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
        { label: 'Pending Pickup', count: requestorPickupGroups.reduce((sum, g) => sum + g.orders.length, 0) },
        { label: 'Pending Users', count: usersAwaitingApproval.length },
    ];

    const tabLabel = (label: string, count: number) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}
            <Chip
                label={count}
                size="small"
                sx={{
                    bgcolor: q ? (count > 0 ? '#00695c' : '#cfd8d6') : count > 0 ? '#d32f2f' : '#bdbdbd',
                    color: q && count === 0 ? '#7d8a86' : 'white',
                    fontWeight: 600,
                    height: 20,
                    minWidth: 20,
                    '& .MuiChip-label': { px: 0.75 },
                }}
            />
        </span>
    );

    const emptyTabMessage = (defaultMessage: string) => (
        <Typography sx={{ marginTop: '1rem' }} variant="body1">
            {q ? `No matches for “${searchInput}” in this tab — check the badges above.` : defaultMessage}
        </Typography>
    );

    return (
        <ProtectedAdminRoute>
            <DonationDetailsDialog
                open={donationToDisplay !== null}
                donation={donationToDisplay}
                onClose={() => setDonationIdToDisplay(null)}
                onUpdated={() => setNotificationsUpdated?.(true)}
            />
            {userIdToDisplay && <UserDetails id={userIdToDisplay} setIdToDisplay={setUserIdToDisplay} />}
            {orderIdToDisplay && (
                <ReviewOrder
                    id={orderIdToDisplay}
                    setIdToDisplay={setOrderIdToDisplay}
                    setNotificationsUpdated={setNotificationsUpdated}
                />
            )}
            {!userIdToDisplay && !orderIdToDisplay && (
                <>
                    {notifications.donations.length === 0 && notifications.orders.length === 0 && notifications.users.length === 0 ? (
                        <Typography sx={{ marginTop: '1rem' }} variant="body1">
                            No new notifications at this time.
                        </Typography>
                    ) : (
                        <>
                            <TextField
                                fullWidth
                                id="notifications-search"
                                label="Search"
                                placeholder="Search all notifications — tag, brand, donor, requestor"
                                value={searchInput}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>): void => setSearchInput(event.target.value)}
                                sx={{ marginTop: '1rem' }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <Tabs
                                value={activeTab}
                                onChange={(_, newValue) => setActiveTab(newValue)}
                                aria-label="notifications"
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                    marginTop: '1rem',
                                    position: 'sticky',
                                    top: '4.5rem',
                                    zIndex: 6,
                                    backgroundColor: '#fff',
                                    borderBottom: '1px solid #e0e0e0'
                                }}
                            >
                                {tabConfig.map((tab, i) => (
                                    <Tab key={i} label={tabLabel(tab.label, tab.count)} sx={{ color: 'black' }} />
                                ))}
                            </Tabs>

                            <CustomTabPanel value={activeTab} index={0}>
                                {donorGroupsApproval.length > 0 ? (
                                    donorGroupsApproval.map((group, gi) => (
                                        <Paper key={gi} variant="outlined" sx={{ mb: 2, bgcolor: '#fff' }}>
                                            <Box sx={groupHeaderSx(1)}>
                                                {donorHeader(group, true)}
                                            </Box>
                                            {group.nameGroups.map((ng, ni) => {
                                                const nameTier = group.nameGroups.length > 1;
                                                const subLevel = nameTier ? 3 : 2;
                                                return (
                                                    <Box key={ni} sx={nameTier ? railSx(2) : undefined}>
                                                        {nameTier && (
                                                            <Box sx={groupHeaderSx(2)}>
                                                                {nameSubHeader(ng.displayName, ng.totalItems)}
                                                            </Box>
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
                                                                <Box key={si} sx={railSx(subLevel)}>
                                                                    <Box sx={groupHeaderSx(subLevel)}>
                                                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
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
                                                );
                                            })}
                                        </Paper>
                                    ))
                                ) : (
                                    emptyTabMessage('No donations pending approval.')
                                )}
                            </CustomTabPanel>

                            <CustomTabPanel value={activeTab} index={1}>
                                {donorGroupsDelivery.length > 0 ? (
                                    donorGroupsDelivery.map((group, gi) => (
                                        <Paper key={gi} variant="outlined" sx={{ mb: 2, bgcolor: '#fff' }}>
                                            <Box sx={groupHeaderSx(1)}>
                                                {donorHeader(group, true)}
                                            </Box>
                                            {group.nameGroups.map((ng, ni) => (
                                                <Box key={ni} sx={group.nameGroups.length > 1 ? railSx(2) : undefined}>
                                                    {group.nameGroups.length > 1 && (
                                                        <Box sx={groupHeaderSx(2)}>
                                                            {nameSubHeader(ng.displayName, ng.totalItems)}
                                                        </Box>
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
                                    emptyTabMessage('No donations pending delivery.')
                                )}
                            </CustomTabPanel>

                            <CustomTabPanel value={activeTab} index={2}>
                                {requestorGroups.length > 0 ? (
                                    requestorGroups.map((group) => (
                                        <Paper key={group.requestorId} variant="outlined" sx={{ mb: 2, bgcolor: '#fff' }}>
                                            <Box sx={groupHeaderSx(1)}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {group.requestorName}
                                                    <Typography component="span" variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                                                        {` — ${itemCount(group.totalItems)}`}
                                                        {group.orders.length === 1 && group.orders[0].createdAt && ` · ${group.orders[0].createdAt.toDate().toLocaleDateString()}`}
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
                                                    <Box key={order.id} sx={railSx(2)}>
                                                        <Box sx={groupHeaderSx(2)}>
                                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                Order {oi + 1} — {itemCount(order.items.length)}
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
                                    emptyTabMessage('No requested equipment.')
                                )}
                            </CustomTabPanel>

                            <CustomTabPanel value={activeTab} index={3}>
                                {requestorPickupGroups.length > 0 ? (
                                    requestorPickupGroups.map((group) => (
                                        <Paper key={group.requestorId} variant="outlined" sx={{ mb: 2, bgcolor: '#fff' }}>
                                            <Box sx={groupHeaderSx(1)}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {group.requestorName}
                                                    <Typography component="span" variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                                                        {group.requestorEmail ? ` (${group.requestorEmail})` : ''}
                                                        {` — ${itemCount(group.totalItems)}`}
                                                        {group.orders.length === 1 && group.orders[0].createdAt && ` · ${group.orders[0].createdAt.toDate().toLocaleDateString()}`}
                                                    </Typography>
                                                </Typography>
                                            </Box>
                                            {group.orders.length === 1 ? (
                                                <Box sx={{ p: 1 }}>
                                                    {group.orders[0].items.map((donation) => (
                                                        <NotificationCard
                                                            key={donation.id}
                                                            type="reserved"
                                                            donation={donation}
                                                            setIdToDisplay={setDonationIdToDisplay}
                                                            setNotificationsUpdated={setNotificationsUpdated}
                                                        />
                                                    ))}
                                                </Box>
                                            ) : (
                                                group.orders.map((order, oi) => (
                                                    <Box key={order.orderId} sx={railSx(2)}>
                                                        <Box sx={groupHeaderSx(2)}>
                                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                Order {oi + 1} — {itemCount(order.items.length)}
                                                                {order.createdAt && ` · ${order.createdAt.toDate().toLocaleDateString()}`}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ p: 1 }}>
                                                            {order.items.map((donation) => (
                                                                <NotificationCard
                                                                    key={donation.id}
                                                                    type="reserved"
                                                                    donation={donation}
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
                                    emptyTabMessage('No donations pending pickup.')
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
                                    emptyTabMessage('No users pending approval.')
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
