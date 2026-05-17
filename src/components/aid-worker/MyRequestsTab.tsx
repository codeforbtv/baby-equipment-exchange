'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Stack, Typography, Chip } from '@mui/material';
import { getMyOrders } from '@/app/actions/firebase';
import { getAuthIdToken, addErrorEvent } from '@/api/firebase';
import Loader from '../Loader';

type OrderItem = {
    id: string;
    brand: string;
    model: string;
    category: string;
    status: string;
    tagNumber: string;
    image: string | null;
};

type Order = {
    id: string;
    status: string;
    createdAt: string | null;
    items: OrderItem[];
    rejectedItems: OrderItem[];
};

type StatusFilter = 'all' | 'open' | 'closed';

const statusHeadingStyle: Record<string, { color: string; bg: string }> = {
    requested: { color: '#616161', bg: '#f0f0f0' },
    reserved: { color: '#2e7d72', bg: '#e0f2f1' },
    distributed: { color: '#2e7d32', bg: '#e8f5e9' },
    rejected: { color: '#c62828', bg: '#fce4ec' },
};

const orderStatusChip: Record<string, { bg: string; color: string }> = {
    open: { bg: '#e0f2f1', color: '#2e7d72' },
    closed: { bg: '#f0f0f0', color: '#616161' },
};

const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
];

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
        reserved: 'Reserved for pickup',
        distributed: 'Distributed',
        rejected: 'Rejected',
    };
    return labels[status] ?? status;
}

function formatDate(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function MyRequestsTab() {
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    useEffect(() => {
        async function fetch() {
            setIsLoading(true);
            try {
                const idToken = await getAuthIdToken();
                const result = await getMyOrders({ idToken });
                setOrders(result ?? []);
            } catch (error) {
                addErrorEvent('Fetch my orders', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetch();
    }, []);

    const filteredOrders = useMemo(() => {
        if (statusFilter === 'all') return orders;
        return orders.filter((o) => o.status === statusFilter);
    }, [orders, statusFilter]);

    if (isLoading) return <Loader />;

    if (orders.length === 0) {
        return (
            <Stack sx={{ py: 4, alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    You haven&apos;t submitted any requests yet.
                </Typography>
            </Stack>
        );
    }

    return (
        <>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
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

            {filteredOrders.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No {statusFilter} requests.
                </Typography>
            )}

            <Stack spacing={2}>
                {filteredOrders.map((order) => {
                    const groups = groupByStatus(order.items, order.rejectedItems);
                    const chipStyle = orderStatusChip[order.status] ?? orderStatusChip.closed;

                    return (
                        <Paper key={order.id} variant="outlined" sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    {formatDate(order.createdAt)}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={order.status === 'open' ? 'Open' : 'Closed'}
                                    sx={{ bgcolor: chipStyle.bg, color: chipStyle.color, fontWeight: 600, fontSize: '0.75rem' }}
                                />
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
                })}
            </Stack>
        </>
    );
}
