import { getInventory } from '@/api/firebase-donations';
import { useEffect, useState } from 'react';
//Hooks
import { useUserContext } from '@/contexts/UserContext';
//Components
import { ImageList } from '@mui/material';
import { addErrorEvent } from '@/api/firebase';
import InventoryItemCard from './InventoryItemCard';
import Loader from './Loader';
import Badge from '@mui/material/Badge';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
//Styles
import '../styles/globalStyles.css';
import styles from './Inventory.module.css';
import { InventoryItem } from '@/models/inventoryItem';
import { InventoryItemCardProps } from '@/types/DonationTypes';
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';

const Inventory = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const { currentUser, isAidWorker } = useUserContext();
    const { addRequestedInventoryItem, requestedInventory, removeRequestedInventoryItem } = useRequestedInventoryContext();

    async function fetchInventory(): Promise<void> {
        if (isAidWorker) {
            try {
                setIsLoading(true);
                const inventoryResult = await getInventory();
                setInventory(inventoryResult);
                setIsLoading(false);
            } catch (error) {
                addErrorEvent('Fetch inventory', error);
            }
        }
        setIsLoading(false);
        return;
    }

    useEffect(() => {
        fetchInventory();
    }, []);

    useEffect(() => {
        console.log(requestedInventory);
    }, [requestedInventory]);

    if (isLoading) return <Loader />;

    const handleRequestInventoryItem = (inventoryItemID: string) => {
        addRequestedInventoryItem(inventoryItemID);
        setInventory(inventory.filter((inventoryItem) => inventoryItem.id !== inventoryItemID));
    };

    return (
        <>
            <div className="page--header">
                <h1>Inventory</h1>
            </div>
            <div>
                {requestedInventory.length > 0 && (
                    <Badge badgeContent={requestedInventory.length}>
                        <ShoppingCartIcon />
                    </Badge>
                )}
            </div>
            {inventory == null || inventory.length == 0 ? (
                <p>There is no inventory for you to view. </p>
            ) : (
                <ImageList className={styles['browse__grid']}>
                    {inventory.map((inventoryItem) => {
                        const props: InventoryItemCardProps = {
                            ...inventoryItem,
                            images: inventoryItem.images as string[],
                            requestHandler: handleRequestInventoryItem
                        };
                        return <InventoryItemCard key={inventoryItem.id} {...props} />;
                    })}
                </ImageList>
            )}
        </>
    );
};

export default Inventory;
