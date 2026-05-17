'use client';

import { useEffect, useMemo, useState } from 'react';
import { TextField, Autocomplete, Chip, Stack, InputAdornment, Typography, Box, Snackbar, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { getInventory } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { InventoryItem } from '@/models/inventoryItem';
import ItemCard from './ItemCard';
import Loader from '../Loader';
import posthog from 'posthog-js';

type BrowseTabProps = {
    onCheckout: () => void;
    onOpenDetail: (item: InventoryItem) => void;
};

export default function BrowseTab({ onCheckout, onOpenDetail }: BrowseTabProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [isSnackBarOpen, setIsSnackBarOpen] = useState(false);

    const { addRequestedInventoryItem, requestedInventory } = useRequestedInventoryContext();

    useEffect(() => {
        async function fetch() {
            setIsLoading(true);
            try {
                const result = await getInventory();
                setInventory(result);
            } catch (error) {
                addErrorEvent('Fetch inventory', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetch();
    }, []);

    const availableCategories = useMemo(
        () => [...new Set(inventory.map((item) => item.category).filter(Boolean))].sort(),
        [inventory]
    );

    const inventoryToDisplay = useMemo(() => {
        const requestedIds = requestedInventory.map((i) => i.id);
        let filtered = inventory.filter((item) => !requestedIds.includes(item.id));

        if (searchInput.length > 0) {
            const search = searchInput.toLowerCase();
            filtered = filtered.filter((item) => {
                const values = [item.tagNumber, item.category, item.brand, item.model, item.description, item.id];
                return values.some((v) => String(v ?? '').toLowerCase().includes(search));
            });
        }
        if (categoryFilter.length > 0) {
            filtered = filtered.filter((item) => categoryFilter.includes(item.category));
        }
        return filtered;
    }, [inventory, requestedInventory, searchInput, categoryFilter]);

    const handleAdd = (item: InventoryItem) => {
        addRequestedInventoryItem(item);
        posthog.capture('inventory_item_added_to_cart', { item_id: item.id, category: item.category });
        setIsSnackBarOpen(true);
    };

    if (isLoading) return <Loader />;

    return (
        <>
            <Stack spacing={2} sx={{ mb: 3 }}>
                <TextField
                    label="Search"
                    placeholder="Search by tag, brand, model, or category"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        )
                    }}
                />
                <Autocomplete
                    multiple
                    options={availableCategories}
                    value={categoryFilter}
                    onChange={(_, newValue) => setCategoryFilter(newValue)}
                    renderInput={(params) => <TextField {...params} variant="standard" label="Filter by category" placeholder="Category" />}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                            const { key, ...tagProps } = getTagProps({ index });
                            return <Chip key={key} label={option} {...tagProps} />;
                        })
                    }
                />
            </Stack>

            {inventoryToDisplay.length === 0 ? (
                <Typography>No products found.</Typography>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: 'repeat(2, 1fr)',
                            sm: 'repeat(3, 1fr)',
                            md: 'repeat(4, 1fr)',
                            lg: 'repeat(5, 1fr)'
                        },
                        gap: 2
                    }}
                >
                    {inventoryToDisplay.map((item) => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            onAdd={() => handleAdd(item)}
                            onOpenDetail={() => onOpenDetail(item)}
                        />
                    ))}
                </Box>
            )}

            <Snackbar
                open={isSnackBarOpen}
                autoHideDuration={4000}
                onClose={(_, reason) => reason !== 'clickaway' && setIsSnackBarOpen(false)}
                message="Item added to cart"
                action={
                    <IconButton size="small" color="inherit" onClick={() => setIsSnackBarOpen(false)}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                }
            />
        </>
    );
}
