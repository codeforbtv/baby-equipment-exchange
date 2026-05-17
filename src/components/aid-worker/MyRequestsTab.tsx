'use client';

import { useEffect, useState } from 'react';
import { Box, Paper, Stack, Typography, Chip, Divider } from '@mui/material';
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

type StatusKey = 'requested' | 'reserved' | 'distributed' | 'rejected';
type ChipColor = 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' | 'secondary';

const statusDisplay: Record<StatusKey, { color: ChipColor; label: string }> = {
    requested: { color: 'default', label: 'Requested' },
    reserved: { color: 'primary', label: 'Reserved for pickup' },
    distributed: { color: 'success', label: 'Distributed' },
    rejected: { color: 'error', label: 'Rejected' }
};

function statusChip(status: string) {
    const display = statusDisplay[status as StatusKey] ?? { color: 'default' as ChipColor, label: status };
    return <Chip size="small" color={display.color} label={display.label} />;
}

function formatDate(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function ItemRow({ item }: { item: OrderItem }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
            {item.image && (
                <img
                    src={item.image}
                    alt={`${item.brand} ${item.model}`}
                    width={48}
                    height={48}
                    style={{ objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                />
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={500} noWrap>
                    {item.brand} {item.model}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {item.category}{item.tagNumber ? ` · ${item.tagNumber}` : ''}
                </Typography>
            </Box>
            {statusChip(item.status)}
        </Box>
    );
}

export default function MyRequestsTab() {
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);

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
        <Stack spacing={2}>
            {orders.map((order) => (
                <Paper key={order.id} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            {formatDate(order.createdAt)}
                        </Typography>
                        <Chip
                            size="small"
                            label={order.status}
                            variant={order.status === 'open' ? 'filled' : 'outlined'}
                            color={order.status === 'open' ? 'primary' : 'default'}
                        />
                    </Box>
                    <Divider sx={{ mb: 1 }} />
                    <Stack divider={<Divider flexItem />}>
                        {order.items.map((item) => (
                            <ItemRow key={item.id} item={item} />
                        ))}
                    </Stack>
                    {order.rejectedItems.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="error" fontWeight={600}>
                                Rejected items
                            </Typography>
                            <Stack divider={<Divider flexItem />}>
                                {order.rejectedItems.map((item) => (
                                    <ItemRow key={item.id} item={{ ...item, status: 'rejected' }} />
                                ))}
                            </Stack>
                        </Box>
                    )}
                </Paper>
            ))}
        </Stack>
    );
}
