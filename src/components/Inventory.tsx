'use client';

import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { useRouter } from 'next/navigation';
import InventoryItemCard from './InventoryItemCard';
import InventoryDetailsDialog from './InventoryDetailsDialog';
import {
    IconButton,
    Badge,
    Tooltip,
    Snackbar,
    SnackbarCloseReason,
    Button,
    Typography,
    Autocomplete,
    TextField,
    Chip,
    Stack,
    InputAdornment,
    Box
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import posthog from 'posthog-js';
import '@/styles/globalStyles.css';
import { InventoryItem } from '@/models/inventoryItem';
import { donationStatuses, DonationStatuses } from '@/models/donation';

type InventoryProps = {
    inventory: InventoryItem[];
    setInventoryUpdated?: Dispatch<SetStateAction<boolean>>;
};

const Inventory = (props: InventoryProps) => {
    const { inventory } = props;
    const [searchInput, setSearchInput] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string[] | undefined>([]);
    const [statusFilter, setStatusFilter] = useState<string[] | undefined>([]);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [isSnackBarOpen, setIsSnackBarOpen] = useState<boolean>(false);

    const handleCloseSnackBar = (_event: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
        if (reason === 'clickaway') return;
        setIsSnackBarOpen(false);
    };

    const action = (
        <IconButton size="small" aria-label="close" color="inherit" onClick={handleCloseSnackBar}>
            <CloseIcon fontSize="small" />
        </IconButton>
    );

    const { addRequestedInventoryItem, requestedInventory } = useRequestedInventoryContext();
    const router = useRouter();

    const handleOpenCart = () => {
        router.push('/admin-cart');
    };

    const availableCategories = useMemo(
        () => [...new Set(inventory.map((item) => item.category).filter(Boolean))].sort(),
        [inventory]
    );

    const availableStatuses = useMemo(() => {
        const statusValues = new Set(inventory.map((item) => item.status).filter(Boolean));
        return Object.entries(donationStatuses)
            .filter(([, value]) => statusValues.has(value))
            .map(([key]) => key);
    }, [inventory]);

    const inventoryToDisplay = useMemo(() => {
        const requestedInventoryIds = requestedInventory.map((i) => i.id);
        let filteredInventory = inventory.filter((item) => !requestedInventoryIds.includes(item.id));

        if (searchInput.length > 0) {
            const search = searchInput.toLowerCase();
            filteredInventory = filteredInventory.filter((item) => {
                const searchableValues = [item.tagNumber, item.status, item.category, item.brand, item.model, item.description, item.id];
                return searchableValues.some((value) => String(value ?? '').toLowerCase().includes(search));
            });
        }
        if (categoryFilter && categoryFilter.length > 0) {
            filteredInventory = filteredInventory.filter((item) => categoryFilter.includes(item.category));
        }
        if (statusFilter && statusFilter.length > 0) {
            filteredInventory = filteredInventory.filter((item) =>
                statusFilter.some((filter) => donationStatuses[filter as keyof DonationStatuses] === item.status)
            );
        }
        return filteredInventory;
    }, [requestedInventory, inventory, categoryFilter, statusFilter, searchInput]);

    const handleRequestInventoryItem = (inventoryItem: InventoryItem) => {
        addRequestedInventoryItem(inventoryItem);
        posthog.capture('inventory_item_added_to_cart', {
            item_id: inventoryItem.id,
            category: inventoryItem.category
        });
        setIsSnackBarOpen(true);
    };

    return (
        <>
            <div className="page--header" style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
                <Typography variant="h5">Inventory</Typography>
                <div>
                    {requestedInventory.length > 0 && (
                        <Badge badgeContent={requestedInventory.length} color="primary">
                            <Tooltip title="View order">
                                <IconButton color="inherit" onClick={handleOpenCart}>
                                    <ShoppingCartIcon />
                                </IconButton>
                            </Tooltip>
                        </Badge>
                    )}
                </div>
            </div>
            <Stack spacing={2} sx={{ mb: 3 }}>
                <TextField
                    label="Search"
                    id="search-field"
                    placeholder="Search by tag, status, brand, model, or category"
                    value={searchInput}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>): void => setSearchInput(event.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        )
                    }}
                />
                <Autocomplete
                    sx={{ maxWidth: '80vw' }}
                    multiple
                    id="category-filter"
                    options={availableCategories}
                    value={categoryFilter}
                    onChange={(_event, newValue) => setCategoryFilter(newValue)}
                    renderInput={(params) => <TextField {...params} variant="standard" label="Filter by category" placeholder="Category" />}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                            const { key, ...tagProps } = getTagProps({ index });
                            return <Chip key={key} label={option} {...tagProps} />;
                        })
                    }
                />
                <Autocomplete
                    sx={{ maxWidth: '80vw' }}
                    multiple
                    id="status-filter"
                    options={availableStatuses}
                    value={statusFilter}
                    onChange={(_event, newValue) => setStatusFilter(newValue)}
                    renderInput={(params) => <TextField {...params} variant="standard" label="Filter by status" placeholder="Status" />}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                            const { key, ...tagProps } = getTagProps({ index });
                            return <Chip key={key} label={option} {...tagProps} />;
                        })
                    }
                />
            </Stack>
            {inventoryToDisplay.length === 0 ? (
                <p>No products found.</p>
            ) : (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(4, 1fr)'
                    },
                    gap: 2
                }}>
                    {inventoryToDisplay.map((inventoryItem: InventoryItem) => (
                        <InventoryItemCard
                            key={inventoryItem.id}
                            inventoryItem={inventoryItem}
                            onSelect={(item) => setSelectedItem(item)}
                            handleRequestInventoryItem={handleRequestInventoryItem}
                        />
                    ))}
                </Box>
            )}
            {requestedInventory.length > 0 && (
                <Button variant="contained" onClick={handleOpenCart} sx={{ mt: 2 }}>
                    Checkout
                </Button>
            )}
            <InventoryDetailsDialog
                open={selectedItem !== null}
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                handleRequestInventoryItem={handleRequestInventoryItem}
            />
            <Snackbar open={isSnackBarOpen} autoHideDuration={6000} onClose={handleCloseSnackBar} message="Item added to order" action={action} />
        </>
    );
};

export default Inventory;
