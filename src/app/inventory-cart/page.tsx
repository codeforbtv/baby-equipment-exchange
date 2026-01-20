'use client';

//Hooks
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { useUserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
//Components
import { Card, Button, Box, Typography, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Loader from '@/components/Loader';
import Image from 'next/image';
import CustomDialog from '@/components/CustomDialog';
//Libs
import { requestInventoryItems } from '@/api/firebase-donations';
import { addErrorEvent, callAreDonationsAvailable } from '@/api/firebase';
//Styles
import '@/styles/globalStyles.css';
import styles from './InventoryCart.module.css';
import { InventoryItem } from '@/models/inventoryItem';

const InventoryCart = () => {
    const { requestedInventory, removeRequestedInventoryItem, isLoading, clearRequestedInventory } = useRequestedInventoryContext();

    const [loading, setLoading] = useState<boolean>(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState<boolean>(false);
    const [isUnavailableDialogOpen, setIsUnavailableDialogOpen] = useState<boolean>(false);
    const [unavailableDialogContent, setUnavailableDialogContent] = useState<string>('');

    const router = useRouter();
    const { currentUser } = useUserContext();

    const handleSuccessDialogClose = () => {
        setIsSuccessDialogOpen(false);
        router.push('/');
    };

    const handleUnavailableDialogClose = () => {
        setUnavailableDialogContent('');
        setIsUnavailableDialogOpen(false);
    };

    const handleRequestItems = async (event: React.MouseEvent<HTMLElement>): Promise<void> => {
        if (!requestedInventory || requestedInventory.length == 0 || !currentUser) return;
        setLoading(true);
        try {
            const requestedItemIds = requestedInventory.map((item) => item.id);

            //Make sure requested items are still available
            const unavailableItemIds = await callAreDonationsAvailable(requestedItemIds);

            if (unavailableItemIds.length > 0) {
                const unavailableItems: InventoryItem[] = requestedInventory.filter((item) => unavailableItemIds.includes(item.id));
                let dialogContent = 'The following items are no longer available: ';
                unavailableItems.map((item, i) => {
                    dialogContent += i < unavailableItems.length - 1 ? `"${item.brand} ${item.model}," ` : `"${item.brand} ${item.model}." `;
                });
                dialogContent += 'Please remove them from your cart and try again.';
                setUnavailableDialogContent(dialogContent);
                setIsUnavailableDialogOpen(true);
                return;
            }

            const user = {
                id: currentUser.uid,
                name: currentUser.displayName ?? '',
                email: currentUser.email ?? ''
            };

            await requestInventoryItems(requestedItemIds, user);
            clearRequestedInventory();
            localStorage.removeItem('requestedInventory');
            setIsSuccessDialogOpen(true);
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
                <Typography variant="h5" sx={{ marginTop: '2em' }}>
                    Your Cart
                </Typography>
            </div>
            {loading ? (
                <Loader />
            ) : (
                <div className="content--container">
                    {requestedInventory == null || requestedInventory.length == 0 ? (
                        <Stack spacing={2}>
                            <Typography variant="body1">There are no items in your cart</Typography>
                            <Button variant="outlined" onClick={() => router.push('/')}>
                                Back to browsing
                            </Button>
                        </Stack>
                    ) : (
                        <Box>
                            <Typography variant="h5">Items to be requested:</Typography>
                            <Box className={styles['inventoryItem--container']}>
                                {requestedInventory.map((inventoryItem, i) => {
                                    if (inventoryItem.images)
                                        return (
                                            <Card key={i} elevation={5} className={styles['inventoryItem--card']}>
                                                <div className={styles['inventoryItem--card-content']}>
                                                    <Image
                                                        src={inventoryItem.images[0] as string}
                                                        alt={`${inventoryItem.brand} ${inventoryItem.model}`}
                                                        width={80}
                                                        height={80}
                                                        style={{ objectFit: 'cover', aspectRatio: '1/1' }}
                                                    />
                                                    <Typography variant="body1">
                                                        {inventoryItem.brand} - {inventoryItem.model}
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
                isOpen={isUnavailableDialogOpen}
                onClose={handleUnavailableDialogClose}
                title="Item(s) no longer available."
                content={unavailableDialogContent}
            />

            <CustomDialog
                isOpen={isSuccessDialogOpen}
                onClose={handleSuccessDialogClose}
                title="Your request has been submitted."
                content="Your requested items have been submitted. You will receive an email with next steps once your order has been processed."
            />
        </>
    );
};

export default InventoryCart;
