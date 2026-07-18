'use client';

import { Dispatch, SetStateAction, useEffect, useMemo, useState, forwardRef } from 'react';
import { GridComponents, VirtuosoGrid } from 'react-virtuoso';
import { useUserContext } from '@/contexts/UserContext';
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { useRouter } from 'next/navigation';
import InventoryItemCard from './InventoryItemCard';
import InventoryDetailsDialog from './InventoryDetailsDialog';
import Loader from './Loader';
import {
    IconButton,
    Badge,
    Box,
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
    Paper
} from '@mui/material';
import ProtectedAidWorkerRoute from './ProtectedAidWorkerRoute';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { getInventory } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';
import '../styles/globalStyles.css';
import { InventoryItem } from '@/models/inventoryItem';
type InventoryProps = {
    inventory?: InventoryItem[];
    setInventoryUpdated?: Dispatch<SetStateAction<boolean>>;
};

const gridComponents: GridComponents = {
    List: forwardRef(function GridList({ style, children, ...props }, ref) {
        return (
            <Box
                ref={ref}
                {...props}
                style={style}
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(4, 1fr)'
                    },
                    gap: 2,
                    // VirtuosoGrid repositions rows by changing this element's padding;
                    // browser scroll anchoring fights that in useWindowScroll mode and
                    // the page oscillates. Virtuoso disables anchoring for its list/table
                    // scrollers but not for the grid, so opt out here.
                    overflowAnchor: 'none'
                }}
            >
                {children}
            </Box>
        );
    }),
    // minWidth: 0 keeps a card's noWrap text from inflating the grid item's
    // automatic minimum size and blowing out the 1fr column widths.
    Item: forwardRef(function GridItem({ style, children, ...props }, ref) {
        return (
            <div ref={ref} {...props} style={{ ...style, minWidth: 0 }}>
                {children}
            </div>
        );
    })
};

const Inventory = (props: InventoryProps) => {
    const { inventory } = props;
    const [isLoading, setIsLoading] = useState(false);
    const [currentInventory, setCurrentInventory] = useState<InventoryItem[]>(inventory ?? []);
    const [searchInput, setSearchInput] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string[] | undefined>([]);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [isSnackBarOpen, setIsSnackBarOpen] = useState<boolean>(false);

    const handleCloseSnackBar = (event: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
        if (reason === 'clickaway') {
            return;
        }
        setIsSnackBarOpen(false);
    };

    //for snackbar notification
    const action = (
        <>
            <IconButton size="small" aria-label="close" color="inherit" onClick={handleCloseSnackBar}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </>
    );

    const { isAidWorker, isAdmin } = useUserContext();
    const { addRequestedInventoryItem, requestedInventory } = useRequestedInventoryContext();
    const router = useRouter();

    async function fetchInventory(): Promise<void> {
        if (isAidWorker) {
            setIsLoading(true);
            try {
                const inventoryResult = await getInventory();
                setCurrentInventory(inventoryResult);
            } catch (error) {
                addErrorEvent('Fetch inventory', error);
            } finally {
                setIsLoading(false);
            }
        }
    }

    const handleOpenCart = () => {
        if (isAdmin) {
            router.push('/admin-cart');
        } else if (isAidWorker) {
            router.push('/inventory-cart');
        }
    };

    const availableCategories = useMemo(
        () => [...new Set(currentInventory.map((item) => item.category).filter(Boolean))].sort(),
        [currentInventory]
    );

    const inventoryToDisplay = useMemo(() => {
        const requestedInventoryIds = requestedInventory.map((i) => i.id);
        let filteredInventory = currentInventory.filter((item) => !requestedInventoryIds.includes(item.id));

        if (searchInput.length > 0) {
            const search = searchInput.toLowerCase();
            filteredInventory = filteredInventory.filter((item) => {
                const searchableValues = [item.tagNumber, item.status, item.category, item.brand, item.model, item.description];
                return searchableValues.some((value) => String(value ?? '').toLowerCase().includes(search));
            });
        }
        if (categoryFilter && categoryFilter.length > 0) {
            filteredInventory = filteredInventory.filter((item) => categoryFilter.includes(item.category));
        }
        return filteredInventory;
    }, [requestedInventory, currentInventory, categoryFilter, searchInput]);

    useEffect(() => {
        if (!inventory) fetchInventory();
    }, []);

    if (isLoading) return <Loader />;

    const handleRequestInventoryItem = (inventoryItem: InventoryItem) => {
        addRequestedInventoryItem(inventoryItem);
        setIsSnackBarOpen(true);
    };

    return (
        <ProtectedAidWorkerRoute>
            <div className="page--header" style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
                <Typography variant="h5">Inventory</Typography>
                <Paper variant="outlined" sx={{ padding: '2px' }}>
                    <Typography variant="body1">
                        <b>DISCLAIMER: </b> ALL ITEMS ARE TRANSFERRED AS IS. THE EXCHANGE EXPRESSLY DISCLAIMS ALL OTHER WARRANTIES EXPRESS OR IMPLIED,
                        INCLUDING BUT NOT LIMITED TO ANY IMPLIED WARRANTY OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. Recipients of
                        products from the Exchange should inspect items and verify recall status prior to use.
                    </Typography>
                </Paper>

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
            {isLoading ? (
                <Loader />
            ) : (
                <>
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
                    </Stack>
                    {inventoryToDisplay == null || inventoryToDisplay.length === 0 ? (
                        <p>No products found.</p>
                    ) : (
                        <VirtuosoGrid
                            useWindowScroll
                            increaseViewportBy={{ top: 600, bottom: 1200 }}
                            totalCount={inventoryToDisplay.length}
                            computeItemKey={(index) => inventoryToDisplay[index].id}
                            components={gridComponents}
                            itemContent={(index) => (
                                <InventoryItemCard
                                    inventoryItem={inventoryToDisplay[index]}
                                    onSelect={(item) => setSelectedItem(item)}
                                    handleRequestInventoryItem={handleRequestInventoryItem}
                                />
                            )}
                        />
                    )}
                    {requestedInventory.length > 0 && (
                        <Button variant="contained" onClick={handleOpenCart} sx={{ mt: 2 }}>
                            Checkout
                        </Button>
                    )}
                </>
            )}
            <InventoryDetailsDialog
                open={selectedItem !== null}
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                handleRequestInventoryItem={handleRequestInventoryItem}
            />
            <Snackbar open={isSnackBarOpen} autoHideDuration={6000} onClose={handleCloseSnackBar} message="Item added to order" action={action} />
        </ProtectedAidWorkerRoute>
    );
};

export default Inventory;
