import { getInventory } from '@/api/firebase-donations';
import { useEffect, useState } from 'react';
//Hooks
import { useUserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
//Components
import { addErrorEvent } from '@/api/firebase';
import InventoryItemCard from './InventoryItemCard';
import Loader from './Loader';
import { IconButton, Badge, ImageList } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

//Types
import { InventoryItemCardProps } from '@/types/DonationTypes';

//Styles
import '../styles/globalStyles.css';
import styles from './Inventory.module.css';
import { InventoryItem } from '@/models/inventoryItem';
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';

const Inventory = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const { currentUser, isAidWorker } = useUserContext();
    const { addRequestedInventoryItem, requestedInventory, removeRequestedInventoryItem } = useRequestedInventoryContext();
    const router = useRouter();

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

    if (isLoading) return <Loader />;

    const handleRequestInventoryItem = (inventoryItem: InventoryItem) => {
        addRequestedInventoryItem(inventoryItem);
        setInventory(inventory.filter((item) => inventoryItem.id !== item.id));
    };

    return (
        <>
            <div className="page--header">
                <h1>Inventory</h1>
            </div>
            <div>
                {requestedInventory.length > 0 && (
                    <Badge badgeContent={requestedInventory.length} color="primary">
                        <IconButton color="inherit" onClick={() => router.push('/inventory-cart')}>
                            <ShoppingCartIcon />
                        </IconButton>
                    </Badge>
                )}
            </div>
            {inventory == null || inventory.length == 0 ? (
                <p>There is no inventory for you to view. </p>
            ) : (
                <ImageList className={styles['browse__grid']}>
                    {inventory.map((inventoryItem: InventoryItem) => {
                        const props: InventoryItemCardProps = {
                            inventoryItem: inventoryItem,
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
