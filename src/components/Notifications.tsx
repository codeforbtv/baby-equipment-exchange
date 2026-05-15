'use client';
//Hooks
import { Dispatch, MouseEvent, SetStateAction, SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import UserDetails from '@/components/UserDetails';
import DonationDetails from '@/components/DonationDetails';
import ReviewOrder from './ReviewOrder';
import NotificationCard from '@/components/NotificationCard';
import CustomTabPanel from './CustomTabPanel';
import { Box, Button, Divider, Menu, MenuItem, Paper, Tab, Tabs, Typography, useMediaQuery } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
//Styles
import '@/styles/globalStyles.css';
import notificationStyles from '@/components/NotificationCard.module.css';
import dashboardStyles from '@/components/Dashboard.module.css';
//Types
import { Notification, NotificationData } from '@/types/NotificationTypes';
import { Donation } from '@/models/donation';
import { Order } from '@/types/OrdersTypes';
import { BookingMatchConfidence } from '@/types/CalendlyTypes';

type NotificationsProps = {
    notifications: Notification;
    onNotificationsChanged?: () => void;
    activeSubTab?: number;
    onSubTabChange?: Dispatch<SetStateAction<number>>;
    notificationData?: NotificationData | null;
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
    orders: Order[];
    totalItems: number;
};

type RelatedPerson = { name?: string; email?: string } | null;
type DateLike = { toMillis?: () => number; toDate?: () => Date } | Date | string | null | undefined;

const getRelatedPersonName = (person: RelatedPerson): string => {
    return (person?.name || person?.email || 'Unknown').trim().toLocaleLowerCase();
};

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

const getDateTime = (date: DateLike): number => {
    return toDateValue(date)?.getTime() ?? 0;
};

const formatShortDate = (date: DateLike): string => {
    return toDateValue(date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? '';
};

const compareByPersonAndDate = (personA: RelatedPerson, dateA: DateLike, personB: RelatedPerson, dateB: DateLike): number => {
    const personCompare = getRelatedPersonName(personA).localeCompare(getRelatedPersonName(personB));
    if (personCompare !== 0) return personCompare;
    return getDateTime(dateA) - getDateTime(dateB);
};

const resolveStateAction = <T,>(value: SetStateAction<T>, previousValue: T): T => {
    return typeof value === 'function' ? (value as (previous: T) => T)(previousValue) : value;
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
        donorMap.get(donorId)!.submissions.push(
            [...bulk].sort((a, b) =>
                compareByPersonAndDate({ name: a.donorName, email: a.donorEmail }, a.createdAt, { name: b.donorName, email: b.donorEmail }, b.createdAt)
            )
        );
    }

    return Array.from(donorMap.entries())
        .map(([donorId, data]) => ({
            donorId,
            donorName: data.donorName,
            donorEmail: data.donorEmail,
            submissions: data.submissions.sort((a, b) =>
                compareByPersonAndDate({ name: a[0].donorName, email: a[0].donorEmail }, a[0].createdAt, { name: b[0].donorName, email: b[0].donorEmail }, b[0].createdAt)
            ),
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
            orders: [...data.orders].sort((a, b) => compareByPersonAndDate(a.requestor, a.createdAt, b.requestor, b.createdAt)),
            totalItems: data.orders.reduce((sum, o) => sum + o.items.length, 0),
        }))
        .sort((a, b) => a.requestorName.localeCompare(b.requestorName));
};

const Notifications = (props: NotificationsProps) => {
    const { notifications, onNotificationsChanged, activeSubTab, onSubTabChange, notificationData, highlightedEntityId } = props;

    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [userIdToDisplay, setUserIdToDisplay] = useState<string | null>(null);
    const [orderIdToDisplay, setOrderIdToDisplay] = useState<string | null>(null);
    const [localSubTab, setLocalSubTab] = useState<number>(0);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const panelStartRef = useRef<HTMLDivElement>(null);
    const sectionScrollPositions = useRef<Record<number, number>>({});
    const pendingRestoreTab = useRef<number | null>(null);
    const wasShowingDetails = useRef(false);
    const matches = useMediaQuery('(min-width:600px)');
    const currentTab = activeSubTab ?? localSubTab;
    const open = Boolean(anchorEl);

    const donationsAwaitingApproval = notifications.donations.filter((donation) => donation.status === 'in processing');
    const donorGroupsApproval = groupByDonor(donationsAwaitingApproval);
    const donationsAwaitingDropoff = notifications.donations.filter((donation) => donation.status === 'pending delivery');
    const donorGroupsDelivery = groupByDonor(donationsAwaitingDropoff);
    const donationsAwaitingPickup = notifications.donations.filter((donation) => donation.status === 'reserved');
    const donorGroupsPickup = groupByDonor(donationsAwaitingPickup);
    const orders = notifications.orders
        .filter((order) => order.items.length > 0)
        .sort((a, b) => compareByPersonAndDate(a.requestor, a.createdAt, b.requestor, b.createdAt));
    const requestorGroups = groupByRequestor(orders);
    const usersAwaitingApproval = notifications.users
        .filter((user) => !user.isDeleted)
        .sort((a, b) => compareByPersonAndDate({ name: a.displayName, email: a.email }, a.createdAt as DateLike, { name: b.displayName, email: b.email }, b.createdAt as DateLike));

    const router = useRouter();
    const isShowingDetails = Boolean(donationIdToDisplay || userIdToDisplay || orderIdToDisplay);

    const tabConfig = [
        { label: 'Pending Approval', count: donationsAwaitingApproval.length },
        { label: 'Pending Delivery', count: donationsAwaitingDropoff.length },
        { label: 'Requested', count: orders.length },
        { label: 'Pending Pickup', count: donationsAwaitingPickup.length },
        { label: 'Pending Users', count: usersAwaitingApproval.length },
    ];

    const scrollToPanelStart = useCallback(() => {
        panelStartRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    }, []);

    const saveCurrentSectionScrollPosition = useCallback(() => {
        sectionScrollPositions.current[currentTab] = window.scrollY;
    }, [currentTab]);

    const handleSubTabChange = useCallback(
        (target: number) => {
            if (target === currentTab) return;

            saveCurrentSectionScrollPosition();
            pendingRestoreTab.current = target;
            setLocalSubTab(target);
            if (onSubTabChange) onSubTabChange(target);
        },
        [currentTab, onSubTabChange, saveCurrentSectionScrollPosition]
    );

    const preserveScrollOnDetailOpen = useCallback(
        (value: SetStateAction<string | null>, setter: Dispatch<SetStateAction<string | null>>) => {
            setter((previousValue) => {
                const nextValue = resolveStateAction(value, previousValue);
                if (nextValue) saveCurrentSectionScrollPosition();
                return nextValue;
            });
        },
        [saveCurrentSectionScrollPosition]
    );

    const setDonationIdToDisplayWithScroll: Dispatch<SetStateAction<string | null>> = (value) =>
        preserveScrollOnDetailOpen(value, setDonationIdToDisplay);

    const setUserIdToDisplayWithScroll: Dispatch<SetStateAction<string | null>> = (value) =>
        preserveScrollOnDetailOpen(value, setUserIdToDisplay);

    const setOrderIdToDisplayWithScroll: Dispatch<SetStateAction<string | null>> = (value) =>
        preserveScrollOnDetailOpen(value, setOrderIdToDisplay);

    useEffect(() => {
        if (pendingRestoreTab.current !== currentTab || highlightedEntityId) return;

        const scrollTop = sectionScrollPositions.current[currentTab];
        pendingRestoreTab.current = null;
        const frameId = window.requestAnimationFrame(() => {
            if (scrollTop === undefined) {
                scrollToPanelStart();
                return;
            }
            window.scrollTo({ top: scrollTop, behavior: 'auto' });
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [currentTab, highlightedEntityId, scrollToPanelStart]);

    useEffect(() => {
        if (wasShowingDetails.current && !isShowingDetails) {
            const scrollTop = sectionScrollPositions.current[currentTab];
            const frameId = window.requestAnimationFrame(() => {
                if (scrollTop === undefined) {
                    scrollToPanelStart();
                    return;
                }
                window.scrollTo({ top: scrollTop, behavior: 'auto' });
            });
            wasShowingDetails.current = isShowingDetails;
            return () => window.cancelAnimationFrame(frameId);
        }

        wasShowingDetails.current = isShowingDetails;
    }, [currentTab, isShowingDetails, scrollToPanelStart]);

    const donorHeader = (name: string, count: number) => (
        <Typography variant="body2" fontWeight={600}>
            {name}
            <Typography component="span" variant="body2" color="text.secondary">
                {` - ${count} item${count !== 1 ? 's' : ''}`}
            </Typography>
        </Typography>
    );

    const emptyTabMessage = (label: string) => (
        <Typography sx={{ marginTop: '1rem' }} variant="body2" color="text.secondary">
            No {label.toLowerCase()} notifications at this time.
        </Typography>
    );

    const getBookingStatus = (donationId: string, mode: 'pickup' | 'dropoff'): BookingMatchConfidence | undefined => {
        const statusResult = mode === 'pickup' ? notificationData?.pickupBookingStatus : notificationData?.dropOffBookingStatus;
        return statusResult?.byDonationId[donationId]?.confidence;
    };

    return (
        <ProtectedAdminRoute>
            {donationIdToDisplay && <DonationDetails id={donationIdToDisplay} setIdToDisplay={setDonationIdToDisplayWithScroll} />}
            {userIdToDisplay && <UserDetails id={userIdToDisplay} setIdToDisplay={setUserIdToDisplayWithScroll} />}
            {orderIdToDisplay && (
                <ReviewOrder
                    id={orderIdToDisplay}
                    setIdToDisplay={setOrderIdToDisplayWithScroll}
                    onNotificationsChanged={onNotificationsChanged}
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
                            <div className={dashboardStyles['sub-navbar']} data-dashboard-sub-navbar="true">
                                {matches ? (
                                    <Tabs
                                        value={currentTab}
                                        onChange={(_event: SyntheticEvent, target: number) => handleSubTabChange(target)}
                                        aria-label="notifications"
                                        variant="scrollable"
                                        scrollButtons="auto"
                                        sx={{
                                            flex: 1,
                                            minWidth: 0,
                                            minHeight: 44,
                                            '& .MuiTab-root': {
                                                color: '#777',
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
                                        {tabConfig.map((tab) => (
                                            <Tab key={tab.label} label={`${tab.label} (${tab.count})`} />
                                        ))}
                                    </Tabs>
                                ) : (
                                    <>
                                        <Button
                                            endIcon={<ArrowDropDownIcon />}
                                            onClick={(event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)}
                                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', color: '#333' }}
                                        >
                                            {`${tabConfig[currentTab].label} (${tabConfig[currentTab].count})`}
                                        </Button>
                                        <Menu id="selected-notification-tab" anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
                                            {tabConfig.map((tab, i) => (
                                                <MenuItem
                                                    key={tab.label}
                                                    selected={i === currentTab}
                                                    onClick={() => {
                                                        handleSubTabChange(i);
                                                        setAnchorEl(null);
                                                    }}
                                                >
                                                    <p>{`${tab.label} (${tab.count})`}</p>
                                                </MenuItem>
                                            ))}
                                        </Menu>
                                    </>
                                )}
                            </div>
                            <div ref={panelStartRef} className={notificationStyles['notification-scroll-anchor']} />

                            {/* Tab 0: Pending Approval - grouped by donor, sub-grouped by bulk submission */}
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
                                                            setIdToDisplay={setDonationIdToDisplayWithScroll}
                                                            onNotificationsChanged={onNotificationsChanged}
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
                                                        <Box key={submission[0].bulkCollection || submission[0].id}>
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
                                                                    setIdToDisplay={setDonationIdToDisplayWithScroll}
                                                                    onNotificationsChanged={onNotificationsChanged}
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
                                    emptyTabMessage('Pending Approval')
                                )}
                            </CustomTabPanel>

                            {/* Tab 1: Pending Delivery - grouped by donor, flat card list */}
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
                                                    setIdToDisplay={setDonationIdToDisplayWithScroll}
                                                    onNotificationsChanged={onNotificationsChanged}
                                                    calendlyStatus={getBookingStatus(donation.id, 'dropoff')}
                                                    isHighlighted={highlightedEntityId === donation.id}
                                                />
                                            ))}
                                        </Paper>
                                    ))
                                ) : (
                                    emptyTabMessage('Pending Delivery')
                                )}
                            </CustomTabPanel>

                            {/* Tab 2: Requested - grouped by requestor, sub-grouped by order */}
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
                                                            onClick={() => setOrderIdToDisplayWithScroll(group.orders[0].id)}
                                                        >
                                                            Review
                                                        </Button>
                                                    </Box>
                                                    {group.orders[0].items.map((item) => (
                                                        <NotificationCard
                                                            key={item.id}
                                                            type="order"
                                                            donation={item}
                                                            setIdToDisplay={setDonationIdToDisplayWithScroll}
                                                            onNotificationsChanged={onNotificationsChanged}
                                                            isHighlighted={highlightedEntityId === group.orders[0].id || highlightedEntityId === item.id}
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
                                                                {` - ${group.orders.length} orders, ${group.totalItems} item${group.totalItems !== 1 ? 's' : ''}`}
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
                                                                    {order.createdAt && ` - ${formatShortDate(order.createdAt)}`}
                                                                </Typography>
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    onClick={() => setOrderIdToDisplayWithScroll(order.id)}
                                                                >
                                                                    Review
                                                                </Button>
                                                            </Box>
                                                            {order.items.map((item) => (
                                                                <NotificationCard
                                                                    key={item.id}
                                                                    type="order"
                                                                    donation={item}
                                                                    setIdToDisplay={setDonationIdToDisplayWithScroll}
                                                                    onNotificationsChanged={onNotificationsChanged}
                                                                    isHighlighted={highlightedEntityId === order.id || highlightedEntityId === item.id}
                                                                />
                                                            ))}
                                                        </Box>
                                                    ))}
                                                </>
                                            )}
                                        </Paper>
                                    ))
                                ) : (
                                    emptyTabMessage('Requested')
                                )}
                            </CustomTabPanel>

                            {/* Tab 3: Pending Pickup - grouped by donor, flat card list */}
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
                                                    setIdToDisplay={setDonationIdToDisplayWithScroll}
                                                    onNotificationsChanged={onNotificationsChanged}
                                                    calendlyStatus={getBookingStatus(donation.id, 'pickup')}
                                                    isHighlighted={highlightedEntityId === donation.id}
                                                />
                                            ))}
                                        </Paper>
                                    ))
                                ) : (
                                    emptyTabMessage('Pending Pickup')
                                )}
                            </CustomTabPanel>

                            {/* Tab 4: Pending Users - no grouping */}
                            <CustomTabPanel value={currentTab} index={4}>
                                {usersAwaitingApproval.length > 0 ? (
                                    usersAwaitingApproval.map((user) => (
                                        <NotificationCard
                                            key={user.uid}
                                            type="pending-user"
                                            user={user}
                                            setIdToDisplay={setUserIdToDisplayWithScroll}
                                            onNotificationsChanged={onNotificationsChanged}
                                            isHighlighted={highlightedEntityId === user.uid}
                                        />
                                    ))
                                ) : (
                                    emptyTabMessage('Pending Users')
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
