'use client';

//Libs
import { requestInventoryItems } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';

//Components
import { Card, Button, Box, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Loader from '@/components/Loader';

//Hooks
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { useUserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';

//Styles
import '../HomeStyles.module.css';
import styles from './InventoryCart.module.css';
import Image from 'next/image';
import { useState } from 'react';
import CustomDialog from '@/components/CustomDialog';

const InventoryCart = () => {
    const { requestedInventory, removeRequestedInventoryItem, isLoading, clearRequestedInventory } = useRequestedInventoryContext();

    const [loading, setLoading] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const router = useRouter();
    const { currentUser } = useUserContext();

    const handleClose = () => {
        setIsDialogOpen(false);
        router.push('/');
    };

    const handleRequestItems = async (event: React.MouseEvent<HTMLElement>): Promise<void> => {
        if (!requestedInventory || requestedInventory.length == 0 || !currentUser) return;
        setLoading(true);
        try {
            const requestedItemIDs = requestedInventory.map((item) => item.id);
            const user = {
                id: currentUser.uid,
                name: currentUser.displayName ?? '',
                email: currentUser.email ?? ''
            };

            await requestInventoryItems(requestedItemIDs, user);
            clearRequestedInventory();
            localStorage.removeItem('requestedInventory');
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Handle request items', error);
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) return <Loader />;

    return (
        <>
            <div className="page--header">
                <h2>Your Cart</h2>
            </div>
            {loading ? (
                <Loader />
            ) : (
                <div className="content--container">
                    {requestedInventory == null || requestedInventory.length == 0 ? (
                        <p>There are no items in your cart</p>
                    ) : (
                        <Box>
                            <Typography variant="h3">Items to be requested:</Typography>
                            <Box className={styles['inventoryItem--container']}>
                                {requestedInventory.map((inventoryItem, i) => {
                                    if (inventoryItem.images)
                                        return (
                                            <Card key={i} elevation={5} className={styles['inventoryItem--card']}>
                                                <Image
                                                    src={inventoryItem.images[0] as string}
                                                    alt={`${inventoryItem.brand} ${inventoryItem.model}`}
                                                    width={60}
                                                    height={60}
                                                    style={{ objectFit: 'cover' }}
                                                />
                                                <div className={styles['text--group']}>
                                                    <Typography variant="h4" className={styles['left--column']}>
                                                        {inventoryItem.model}
                                                    </Typography>
                                                    <Typography variant="h4" className={styles['right--column']}>
                                                        {inventoryItem.brand}
                                                    </Typography>
                                                </div>
                                                <Button variant="outlined" type="button" onClick={() => removeRequestedInventoryItem(i)}>
                                                    <DeleteIcon />
                                                </Button>
                                            </Card>
                                        );
                                })}
                            </Box>
                            <div className={styles['btn--group']}>
                                <Button variant="outlined" onClick={() => router.push('/')}>
                                    Continue browsing
                                </Button>
                                {requestedInventory.length > 0 && (
                                    <Button variant="contained" onClick={handleRequestItems}>
                                        Request Items
                                    </Button>
                                )}
                            </div>
                        </Box>
                    )}
                </div>
            )}

            <CustomDialog
                isOpen={isDialogOpen}
                onClose={handleClose}
                title="Your request has been submitted."
                content="Your requested items have been submitted. You will recieve an email with next steps once your order has been processed."
            />
        </>
    );
};

export default InventoryCart;
