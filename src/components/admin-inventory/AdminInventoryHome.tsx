'use client';

import { Dispatch, SetStateAction, useState } from 'react';
import { Tabs, Tab, Chip, Box } from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HistoryIcon from '@mui/icons-material/History';
import AdminBrowseTab from './AdminBrowseTab';
import AdminCartTab from './AdminCartTab';
import AdminOrdersTab from './AdminOrdersTab';
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { InventoryItem } from '@/models/inventoryItem';

type TabValue = 'browse' | 'cart' | 'orders';

type AdminInventoryHomeProps = {
    inventory: InventoryItem[];
    setInventoryUpdated: Dispatch<SetStateAction<boolean>>;
};

export default function AdminInventoryHome({ inventory, setInventoryUpdated }: AdminInventoryHomeProps) {
    const [activeTab, setActiveTab] = useState<TabValue>('browse');
    const { requestedInventory } = useRequestedInventoryContext();

    const cartCount = requestedInventory.length;

    return (
        <Box>
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
                <Tab value="orders" icon={<HistoryIcon />} iconPosition="start" label="All Orders" />
            </Tabs>

            {activeTab === 'browse' && (
                <AdminBrowseTab inventory={inventory} setInventoryUpdated={setInventoryUpdated} />
            )}
            {activeTab === 'cart' && (
                <AdminCartTab
                    onContinueBrowsing={() => setActiveTab('browse')}
                    onSubmitted={() => setActiveTab('orders')}
                />
            )}
            {activeTab === 'orders' && <AdminOrdersTab />}
        </Box>
    );
}
