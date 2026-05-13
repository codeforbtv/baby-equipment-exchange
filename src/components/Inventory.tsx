'use client';

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
//Hooks
import { useUserContext } from '@/contexts/UserContext';
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { useRouter } from 'next/navigation';
//Components
import InventoryItemCard from './InventoryItemCard';
import Loader from './Loader';
import {
    IconButton,
    Badge,
    ImageList,
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
    Paper,
    useMediaQuery
} from '@mui/material';
import ProtectedAidWorkerRoute from './ProtectedAidWorkerRoute';
//Icons
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
//Api
import { getInventory } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';
//Constants
import { categories } from '@/data/html';
//Styles
import '../styles/globalStyles.css';
import styles from './Inventory.module.css';
//Types
import { InventoryItem } from '@/models/inventoryItem';
import InventoryDetails from './InventoryDetails';
import { donationStatuses, DonationStatuses } from '@/models/donation';

const statusSelectOptions = Object.keys(donationStatuses);

type InventoryProps = {
    inventory?: InventoryItem[];
    setInventoryUpdated?: Dispatch<SetStateAction<boolean>>;
};

const Inventory = (props: InventoryProps) => {
    const { inventory, setInventoryUpdated } = props;
    const [isLoading, setIsLoading] = useState(false);
    const [currentInventory, setCurrentInventory] = useState<InventoryItem[]>(inventory ?? []);
    const [searchInput, setSearchInput] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string[] | undefined>([]);
    const [statusFilter, setStatusFilter] = useState<string[] | undefined>([]);
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);
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

    //Media query for imagelist grid
    const isMobile = useMediaQuery('(max-width:600px)');

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

    //Filters by category/status/search input and prevents items in cart from appearing in inventory list
    const inventoryToDisplay = useMemo(() => {
        const requestedInventoryIds = requestedInventory.map((i) => i.id);
        let filteredInventory = currentInventory.filter((item) => !requestedInventoryIds.includes(item.id));

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
    }, [requestedInventory, currentInventory, categoryFilter, statusFilter, searchInput]);

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
            {idToDisplay && (
                <InventoryDetails
                    id={idToDisplay}
                    inventoryItem={currentInventory.find((i) => i.id === idToDisplay)}
                    setIdToDisplay={setIdToDisplay}
                    setInvetoryUpdated={setInventoryUpdated}
                    handleRequestInventoryItem={handleRequestInventoryItem}
                />
            )}
            {!idToDisplay && (
                <>
                    <div className="page--header" style={{ marginTop: '4em', display: 'flex', flexDirection: 'column', gap: '1em' }}>
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
                            <Stack spacing={2} sx={{ paddingLeft: '1em', marginTop: '1em' }}>
                                <TextField
                                    label="Search"
                                    id="search-field"
                                    placeholder="Search by TAG, status, brand, model, or category"
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
                                    options={categories.map((category) => category.name)}
                                    value={categoryFilter}
                                    onChange={(event, newValue) => setCategoryFilter(newValue)}
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
                                    options={statusSelectOptions}
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
                            {inventoryToDisplay == null || inventoryToDisplay.length == 0 ? (
                                <p>No products found.</p>
                            ) : (
                                <ImageList className={styles['browse__grid']} rowHeight={300} gap={4} cols={isMobile ? 1 : 2}>
                                    {inventoryToDisplay.map((inventoryItem: InventoryItem) => {
                                        return (
                                            <InventoryItemCard
                                                key={inventoryItem.id}
                                                handleRequestInventoryItem={handleRequestInventoryItem}
                                                inventoryItem={inventoryItem}
                                                setIdToDisplay={setIdToDisplay}
                                            />
                                        );
                                    })}
                                </ImageList>
                            )}
                            {requestedInventory.length > 0 && (
                                <Button variant="contained" onClick={handleOpenCart}>
                                    Checkout
                                </Button>
                            )}
                        </>
                    )}
                </>
            )}
            <Snackbar open={isSnackBarOpen} autoHideDuration={6000} onClose={handleCloseSnackBar} message="Item added to order" action={action} />
        </ProtectedAidWorkerRoute>
    );
};

export default Inventory;
