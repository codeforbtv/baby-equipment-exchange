'use client';

import { useState } from 'react';
import { Tabs, Tab, Chip, Box, Paper, Typography } from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HistoryIcon from '@mui/icons-material/History';
import ProtectedAidWorkerRoute from '../ProtectedAidWorkerRoute';
import BrowseTab from './BrowseTab';
import CartTab from './CartTab';
import MyRequestsTab from './MyRequestsTab';
import InventoryDetailsDialog from './InventoryDetailsDialog';
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { InventoryItem } from '@/models/inventoryItem';

type TabValue = 'browse' | 'cart' | 'requests';

export default function AidWorkerHome() {
    const [activeTab, setActiveTab] = useState<TabValue>('browse');
    const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
    const { requestedInventory } = useRequestedInventoryContext();

    const cartCount = requestedInventory.length;

    return (
        <ProtectedAidWorkerRoute>
            <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 3 }, pt: 8, pb: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, mb: 3, overflow: 'visible' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'normal', overflow: 'visible' }}>
                        <b>DISCLAIMER: </b> ALL ITEMS ARE TRANSFERRED AS IS. THE EXCHANGE EXPRESSLY DISCLAIMS ALL OTHER WARRANTIES EXPRESS OR IMPLIED,
                        INCLUDING BUT NOT LIMITED TO ANY IMPLIED WARRANTY OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. Recipients of
                        products from the Exchange should inspect items and verify recall status prior to use.
                    </Typography>
                </Paper>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
                >
                    <Tab value="browse" icon={<GridViewIcon />} iconPosition="start" label="Browse" />
                    <Tab
                        value="cart"
                        icon={<ShoppingCartIcon />}
                        iconPosition="start"
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                Cart
                                {cartCount > 0 && <Chip size="small" label={cartCount} color="primary" />}
                            </Box>
                        }
                    />
                    <Tab value="requests" icon={<HistoryIcon />} iconPosition="start" label="My Requests" />
                </Tabs>

                {activeTab === 'browse' && (
                    <BrowseTab
                        onCheckout={() => setActiveTab('cart')}
                        onOpenDetail={(item) => setDetailItem(item)}
                    />
                )}
                {activeTab === 'cart' && (
                    <CartTab
                        onContinueBrowsing={() => setActiveTab('browse')}
                        onSubmitted={() => setActiveTab('requests')}
                    />
                )}
                {activeTab === 'requests' && <MyRequestsTab />}

                <InventoryDetailsDialog
                    open={detailItem !== null}
                    item={detailItem}
                    onClose={() => setDetailItem(null)}
                />
            </Box>
        </ProtectedAidWorkerRoute>
    );
}
