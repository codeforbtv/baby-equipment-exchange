'use client';

//Hooks
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { useUserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
//Components
import { Card, Button, Box, Typography, Stack, Autocomplete, InputBaseProps, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Loader from '@/components/Loader';
import Image from 'next/image';
import CustomDialog from '@/components/CustomDialog';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import SchedulePickup from '@/components/SchedulePickup';

//Libs
import { adminRequestInventoryItems, adminAreDonationsAvailable } from '@/api/firebase-donations';
import { getAllActiveDbUsers } from '@/api/firebase-users';
import { addErrorEvent } from '@/api/firebase';
//Utils
import { extractEmail } from '@/utils/utils';
//Styles
import '@/styles/globalStyles.css';
import styles from './AdminCart.module.css';
//Types
import { InventoryItem } from '@/models/inventoryItem';
import { IUser } from '@/models/user';
import { Order } from '@/types/OrdersTypes';

const AdminCart = () => {
    const { requestedInventory, removeRequestedInventoryItem, isLoading, clearRequestedInventory } = useRequestedInventoryContext();

    const [loading, setLoading] = useState<boolean>(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState<boolean>(false);
    const [isUnavailableDialogOpen, setIsUnavailableDialogOpen] = useState<boolean>(false);
    const [unavailableDialogContent, setUnavailableDialogContent] = useState<string>('');
    const [activeUsers, setActiveUsers] = useState<IUser[] | null>(null);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [showScheduler, setShowScheduler] = useState<boolean>(false);

    const router = useRouter();
    const { isAdmin } = useUserContext();

    const handleSuccessDialogClose = () => {
        setIsSuccessDialogOpen(false);
        setShowScheduler(true);
    };

    const handleUnavailableDialogClose = () => {
        setUnavailableDialogContent('');
        setIsUnavailableDialogOpen(false);
    };

    const fetchActiveUsers = async (): Promise<void> => {
        setLoading(true);
        try {
            const activeUsersReuslt = await getAllActiveDbUsers();
            setActiveUsers(activeUsersReuslt);
        } catch (error) {
            addErrorEvent('Error fetching active users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdminRequestItems = async (event: React.MouseEvent<HTMLElement>): Promise<void> => {
        if (!isAdmin || !selectedUser) return;
        setLoading(true);
        try {
            const requestedItemIds = requestedInventory.map((item) => item.id);

            //Make sure requested items are still available
            const unavailableItemIds = await adminAreDonationsAvailable(requestedItemIds);

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

            //extract email address from automplete selection and use it to find user info.
            const requestorEmailMatch = extractEmail(selectedUser);
            if (!requestorEmailMatch) return Promise.reject('Requestor email not found');
            const requestor = activeUsers?.find((user) => user.email === requestorEmailMatch[0]);
            if (!requestor) return Promise.reject('Selected requestor not found.');

            const requestorInfo = {
                id: requestor.uid,
                name: requestor.displayName,
                email: requestor.email
            };

            const order = await adminRequestInventoryItems(requestedItemIds, requestorInfo);
            setCurrentOrder(order);
            clearRequestedInventory();
            localStorage.removeItem('requestedInventory');
            setIsSuccessDialogOpen(true);
        } catch (error) {
            addErrorEvent('Handle request items', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!activeUsers) fetchActiveUsers();
    }, []);

    return (
        <ProtectedAdminRoute>
            {showScheduler && currentOrder && <SchedulePickup order={currentOrder} setShowScheduler={setShowScheduler} />}
            {!showScheduler && !currentOrder && (
                <>
                    <div className="page--header">
                        <Typography variant="h5" sx={{ marginTop: '2em' }}>
                            Your Cart
                        </Typography>
                    </div>
                    {loading || isLoading ? (
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
                                    {activeUsers ? (
                                        <Autocomplete
                                            sx={{ marginTop: '2em', maxWidth: { sm: '88%', xs: '80%' } }}
                                            value={selectedUser}
                                            onChange={(event: any, newValue: string | null) => setSelectedUser(newValue)}
                                            id="requestor-select"
                                            options={activeUsers.map((user) => `${user.displayName} (${user.email})`)}
                                            renderInput={(params) => <TextField {...params} label="Requestor" />}
                                        />
                                    ) : (
                                        <Typography variant="body1">Could not load active users.</Typography>
                                    )}

                                    <div className={styles['btn--group']}>
                                        <Button variant="outlined" onClick={() => router.push('/')}>
                                            Continue browsing
                                        </Button>
                                        {requestedInventory.length > 0 && (
                                            <Button variant="contained" disabled={!selectedUser} onClick={handleAdminRequestItems}>
                                                Request Items
                                            </Button>
                                        )}
                                    </div>
                                </Box>
                            )}
                        </div>
                    )}
                </>
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
                content="Your requested items have been submitted. Click ok to send a pickup scheduling link."
            />
        </ProtectedAdminRoute>
    );
};

export default AdminCart;
