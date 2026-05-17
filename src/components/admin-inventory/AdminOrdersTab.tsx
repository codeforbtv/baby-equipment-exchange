'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Chip, Stack, Button, Dialog, DialogContent, DialogTitle, IconButton, ToggleButtonGroup, ToggleButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Loader from '@/components/Loader';
import ReviewOrder from '@/components/ReviewOrder';
import { getAllOrders } from '@/app/actions/firebase';
import { getAuthIdToken, addErrorEvent } from '@/api/firebase';

type OrderItem = {
    id: string;
    brand: string;
    model: string;
    category: string;
    status: string;
    tagNumber: string;
    image: string | null;
};

type OrderData = {
    id: string;
    status: string;
    createdAt: string | null;
    requestor: { id: string; name: string; email: string };
    items: OrderItem[];
    rejectedItems: OrderItem[];
};

type StatusFilter = 'all' | 'open' | 'closed';
type ViewMode = 'order' | 'person';

const statusHeadingStyle: Record<string, { color: string; bg: string }> = {
    requested: { color: '#616161', bg: '#f0f0f0' },
    reserved: { color: '#2e7d72', bg: '#e0f2f1' },
    distributed: { color: '#2e7d32', bg: '#e8f5e9' },
    rejected: { color: '#c62828', bg: '#fce4ec' },
};

function groupByStatus(items: OrderItem[], rejected: OrderItem[]) {
    const groups: Record<string, OrderItem[]> = {};
    for (const item of items) {
        const s = item.status || 'requested';
        if (!groups[s]) groups[s] = [];
        groups[s].push(item);
    }
    if (rejected.length > 0) {
        groups['rejected'] = [...(groups['rejected'] ?? []), ...rejected];
    }
    return groups;
}

function statusLabel(status: string): string {
    const labels: Record<string, string> = {
        requested: 'Requested',
        reserved: 'Reserved',
        distributed: 'Distributed',
        rejected: 'Rejected',
        'in processing': 'In Processing',
        'pending delivery': 'Pending Delivery',
    };
    return labels[status] ?? status;
}

const orderStatusChip: Record<string, { bg: string; color: string }> = {
    open: { bg: '#e0f2f1', color: '#2e7d72' },
    closed: { bg: '#f0f0f0', color: '#616161' },
};

const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
];

function OrderCard({ order, onReview }: { order: OrderData; onReview: (id: string) => void }) {
    const groups = groupByStatus(order.items, order.rejectedItems);
    const chipStyle = orderStatusChip[order.status] ?? orderStatusChip.closed;

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                        {order.requestor.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {order.requestor.email}
                        {order.createdAt && ` · ${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        size="small"
                        label={order.status === 'open' ? 'Open' : 'Closed'}
                        sx={{ bgcolor: chipStyle.bg, color: chipStyle.color, fontWeight: 600, fontSize: '0.75rem' }}
                    />
                    {order.status === 'open' && (
                        <Button size="small" variant="outlined" onClick={() => onReview(order.id)}>
                            Review
                        </Button>
                    )}
                </Box>
            </Box>

            <Stack spacing={1.5}>
                {Object.entries(groups).map(([status, items]) => {
                    const style = statusHeadingStyle[status] ?? { color: '#616161', bg: '#f0f0f0' };
                    return (
                        <Box key={status}>
                            <Typography
                                variant="caption"
                                fontWeight={700}
                                sx={{
                                    color: style.color,
                                    bgcolor: style.bg,
                                    px: 1, py: 0.25,
                                    borderRadius: 0.5,
                                    display: 'inline-block',
                                    mb: 0.5,
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                }}
                            >
                                {statusLabel(status)}
                            </Typography>
                            <Stack spacing={0.5} sx={{ pl: 1 }}>
                                {items.map((item) => (
                                    <Typography key={item.id} variant="body2">
                                        {item.brand} {item.model}
                                    </Typography>
                                ))}
                            </Stack>
                        </Box>
                    );
                })}
            </Stack>
        </Paper>
    );
}

function PersonOrderCard({ order, onReview }: { order: OrderData; onReview: (id: string) => void }) {
    const groups = groupByStatus(order.items, order.rejectedItems);
    const chipStyle = orderStatusChip[order.status] ?? orderStatusChip.closed;

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        size="small"
                        label={order.status === 'open' ? 'Open' : 'Closed'}
                        sx={{ bgcolor: chipStyle.bg, color: chipStyle.color, fontWeight: 600, fontSize: '0.75rem' }}
                    />
                    {order.status === 'open' && (
                        <Button size="small" variant="outlined" onClick={() => onReview(order.id)}>
                            Review
                        </Button>
                    )}
                </Box>
            </Box>
            <Stack spacing={1.5}>
                {Object.entries(groups).map(([status, items]) => {
                    const style = statusHeadingStyle[status] ?? { color: '#616161', bg: '#f0f0f0' };
                    return (
                        <Box key={status}>
                            <Typography
                                variant="caption"
                                fontWeight={700}
                                sx={{
                                    color: style.color, bgcolor: style.bg,
                                    px: 1, py: 0.25, borderRadius: 0.5,
                                    display: 'inline-block', mb: 0.5,
                                    fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5,
                                }}
                            >
                                {statusLabel(status)}
                            </Typography>
                            <Stack spacing={0.5} sx={{ pl: 1 }}>
                                {items.map((item) => (
                                    <Typography key={item.id} variant="body2">
                                        {item.brand} {item.model}
                                    </Typography>
                                ))}
                            </Stack>
                        </Box>
                    );
                })}
            </Stack>
        </Paper>
    );
}

export default function AdminOrdersTab() {
    const [orders, setOrders] = useState<OrderData[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('order');

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const idToken = await getAuthIdToken();
            const result = await getAllOrders({ idToken });
            setOrders(result);
        } catch (error) {
            addErrorEvent('Fetch all orders', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleReviewClose = () => {
        setReviewOrderId(null);
        fetchOrders();
    };

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        if (statusFilter === 'all') return orders;
        return orders.filter((o) => o.status === statusFilter);
    }, [orders, statusFilter]);

    const personGroups = useMemo(() => {
        if (viewMode !== 'person') return [];
        const map = new Map<string, { name: string; email: string; orders: OrderData[] }>();
        for (const order of filteredOrders) {
            const key = order.requestor.id;
            if (!map.has(key)) {
                map.set(key, { name: order.requestor.name, email: order.requestor.email, orders: [] });
            }
            map.get(key)!.orders.push(order);
        }
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [filteredOrders, viewMode]);

    if (isLoading) return <Loader />;

    if (!orders || orders.length === 0) {
        return <Typography variant="body1" sx={{ py: 4 }}>No orders yet.</Typography>;
    }

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Stack direction="row" spacing={1}>
                    {filterOptions.map((opt) => (
                        <Chip
                            key={opt.value}
                            label={opt.label}
                            size="small"
                            variant={statusFilter === opt.value ? 'filled' : 'outlined'}
                            onClick={() => setStatusFilter(opt.value)}
                            sx={statusFilter === opt.value
                                ? { bgcolor: '#e0f2f1', color: '#2e7d72', fontWeight: 600, borderColor: '#3d9991' }
                                : { fontWeight: 500 }
                            }
                        />
                    ))}
                </Stack>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, v) => { if (v) setViewMode(v); }}
                    size="small"
                    sx={{
                        '& .MuiToggleButton-root': { textTransform: 'none', fontSize: '0.75rem', px: 1.5, py: 0.5 },
                        '& .Mui-selected': { bgcolor: '#3d9991 !important', color: '#fff !important' },
                    }}
                >
                    <ToggleButton value="order">By Order</ToggleButton>
                    <ToggleButton value="person">By Person</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {filteredOrders.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No {statusFilter} orders.
                </Typography>
            )}

            {viewMode === 'order' && (
                <Stack spacing={2}>
                    {filteredOrders.map((order) => (
                        <OrderCard key={order.id} order={order} onReview={setReviewOrderId} />
                    ))}
                </Stack>
            )}

            {viewMode === 'person' && (
                <Stack spacing={3}>
                    {personGroups.map((group) => (
                        <Box key={group.email}>
                            <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 1 }}>
                                {group.name} — {group.orders.length} {group.orders.length === 1 ? 'order' : 'orders'}
                            </Typography>
                            <Stack spacing={1.5} sx={{ pl: 1 }}>
                                {group.orders.map((order) => (
                                    <PersonOrderCard key={order.id} order={order} onReview={setReviewOrderId} />
                                ))}
                            </Stack>
                        </Box>
                    ))}
                </Stack>
            )}

            <Dialog open={reviewOrderId !== null} onClose={handleReviewClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Review Order
                    <IconButton onClick={handleReviewClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {reviewOrderId && (
                        <ReviewOrder id={reviewOrderId} setIdToDisplay={() => handleReviewClose()} />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
