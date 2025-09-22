'use client';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';
//Hooks
import { useUserContext } from '@/contexts/UserContext';
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { useRouter } from 'next/navigation';
//Components
import InventoryItemCard from './InventoryItemCard';
import Loader from './Loader';
import { IconButton, Badge, ImageList, Tooltip, Snackbar, SnackbarCloseReason, Button } from '@mui/material';
import ProtectedAidWorkerRoute from './ProtectedAidWorkerRoute';
//Icons
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
//Api
import { getInventory } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';
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
    const [currentInventory, setCurrentInventory] = useState<InventoryItem[]>([]);
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
            } catch (error) {
                addErrorEvent('Fetch inventory', error);
            } finally {
                setIsLoading(false);
            }
        }
    }

    useEffect(() => {
        if (!inventory) fetchInventory();
    }, []);

    if (isLoading) return <Loader />;

    const handleRequestInventoryItem = (inventoryItem: InventoryItem) => {
        addRequestedInventoryItem(inventoryItem);
        setCurrentInventory(currentInventory.filter((item) => inventoryItem.id !== item.id));
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
                        <h3>Inventory</h3>
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
                            {currentInventory == null || currentInventory.length == 0 ? (
                                <p>There is no inventory for you to view. </p>
                            ) : (
                                <ImageList className={styles['browse__grid']} rowHeight={200}>
                                    {currentInventory.map((inventoryItem: InventoryItem) => {
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
                        </>
                    )}
                </>
            )}
            <Snackbar open={isSnackBarOpen} autoHideDuration={6000} onClose={handleCloseSnackBar} message="Item added to order" action={action} />
        </ProtectedAidWorkerRoute>
    );
};

export default Inventory;
