'use client';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';
//Hooks
import { useUserContext } from '@/contexts/UserContext';
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { useRouter } from 'next/navigation';
//Components
import InventoryItemCard from './InventoryItemCard';
import Loader from './Loader';
import { IconButton, Badge, ImageList, Tooltip, Snackbar, SnackbarCloseReason, Button, Typography, Autocomplete, TextField, Chip } from '@mui/material';
import ProtectedAidWorkerRoute from './ProtectedAidWorkerRoute';
//Icons
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
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
type InventoryProps = {
    inventory?: InventoryItem[];
    setInventoryUpdated?: Dispatch<SetStateAction<boolean>>;
};

const Inventory = (props: InventoryProps) => {
    const { inventory, setInventoryUpdated } = props;
    const [isLoading, setIsLoading] = useState(false);
    const [currentInventory, setCurrentInventory] = useState<InventoryItem[]>(inventory ?? []);
    const [inventoryToDisplay, setInventoryToDisplay] = useState<InventoryItem[]>(inventory ?? []);
    const [categoryFilter, setCategoryFilter] = useState<string[] | undefined>([]);
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

    const { isAidWorker } = useUserContext();
    const { addRequestedInventoryItem, requestedInventory, removeRequestedInventoryItem } = useRequestedInventoryContext();
    const router = useRouter();

    async function fetchInventory(): Promise<void> {
        if (isAidWorker) {
            setIsLoading(true);
            try {
                const inventoryResult = await getInventory();
                setCurrentInventory(inventoryResult);
                setInventoryToDisplay(inventoryResult);
            } catch (error) {
                addErrorEvent('Fetch inventory', error);
            } finally {
                setIsLoading(false);
            }
        }
    }

    //Applies category filter and prevents items in cart from appearing in inventory list
    useEffect(() => {
        const requestedInventoryIds = requestedInventory.map((i) => i.id);
        if (!categoryFilter || categoryFilter.length === 0) {
            setInventoryToDisplay(currentInventory.filter((item) => !requestedInventoryIds.includes(item.id)));
        } else {
            setInventoryToDisplay(currentInventory.filter((item) => categoryFilter?.includes(item.category) && !requestedInventoryIds.includes(item.id)));
        }
    }, [requestedInventory, currentInventory, categoryFilter]);

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
                    <div className="page--header">
                        <Typography variant="h5" sx={{ marginTop: '2em' }}>
                            Inventory
                        </Typography>
                    </div>
                    {isLoading ? (
                        <Loader />
                    ) : (
                        <>
                            <div>
                                {requestedInventory.length > 0 && (
                                    <Badge badgeContent={requestedInventory.length} color="primary">
                                        <Tooltip title="View order">
                                            <IconButton color="inherit" onClick={() => router.push('/inventory-cart')}>
                                                <ShoppingCartIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Badge>
                                )}
                            </div>

                            <Autocomplete
                                sx={{ maxWidth: '85vw', paddingLeft: '1em' }}
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
                            {inventoryToDisplay == null || inventoryToDisplay.length == 0 ? (
                                <p>No products found.</p>
                            ) : (
                                <ImageList className={styles['browse__grid']} rowHeight={200}>
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
                                <Button variant="contained" onClick={() => router.push('/inventory-cart')}>
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
