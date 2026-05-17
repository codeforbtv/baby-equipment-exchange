'use client';

import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { useUserContext } from '@/contexts/UserContext';
import { useEffect, useState } from 'react';
import { Card, Button, Box, Typography, Stack, Autocomplete, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Loader from '@/components/Loader';
import Image from 'next/image';
import CustomDialog from '@/components/CustomDialog';
import SchedulePickup from '@/components/SchedulePickup';
import { adminRequestInventoryItems, adminAreDonationsAvailable } from '@/api/firebase-donations';
import { getAllActiveDbUsers } from '@/api/firebase-users';
import { addErrorEvent } from '@/api/firebase';
import { extractEmail } from '@/utils/utils';
import { InventoryItem } from '@/models/inventoryItem';
import { IUser } from '@/models/user';
import { Order } from '@/types/OrdersTypes';

type AdminCartTabProps = {
    onContinueBrowsing: () => void;
    onSubmitted: () => void;
};

export default function AdminCartTab({ onContinueBrowsing, onSubmitted }: AdminCartTabProps) {
    const { requestedInventory, removeRequestedInventoryItem, isLoading, clearRequestedInventory } = useRequestedInventoryContext();
    const { isAdmin } = useUserContext();

    const [loading, setLoading] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [isUnavailableDialogOpen, setIsUnavailableDialogOpen] = useState(false);
    const [unavailableDialogContent, setUnavailableDialogContent] = useState('');
    const [activeUsers, setActiveUsers] = useState<IUser[] | null>(null);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [showScheduler, setShowScheduler] = useState(false);

    const handleSuccessDialogClose = () => {
        setIsSuccessDialogOpen(false);
        setShowScheduler(true);
    };

    const handleUnavailableDialogClose = () => {
        setUnavailableDialogContent('');
        setIsUnavailableDialogOpen(false);
    };

    const handleSchedulerDone = () => {
        setShowScheduler(false);
        setCurrentOrder(null);
        onSubmitted();
    };

    const fetchActiveUsers = async () => {
        setLoading(true);
        try {
            const result = await getAllActiveDbUsers();
            setActiveUsers(result);
        } catch (error) {
            addErrorEvent('Error fetching active users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdminRequestItems = async () => {
        if (!isAdmin || !selectedUser) return;
        setLoading(true);
        try {
            const requestedItemIds = requestedInventory.map((item) => item.id);
            const unavailableItemIds = await adminAreDonationsAvailable(requestedItemIds);

            if (unavailableItemIds.length > 0) {
                const unavailableItems: InventoryItem[] = requestedInventory.filter((item) => unavailableItemIds.includes(item.id));
                let dialogContent = 'The following items are no longer available: ';
                unavailableItems.forEach((item, i) => {
                    dialogContent += i < unavailableItems.length - 1 ? `"${item.brand} ${item.model}," ` : `"${item.brand} ${item.model}." `;
                });
                dialogContent += 'Please remove them from your cart and try again.';
                setUnavailableDialogContent(dialogContent);
                setIsUnavailableDialogOpen(true);
                return;
            }

            const requestorEmailMatch = extractEmail(selectedUser);
            if (!requestorEmailMatch) return;
            const requestor = activeUsers?.find((user) => user.email === requestorEmailMatch[0]);
            if (!requestor) return;

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

    if (showScheduler && currentOrder) {
        return <SchedulePickup order={currentOrder} setShowScheduler={setShowScheduler} onComplete={handleSchedulerDone} />;
    }

    return (
        <>
            {loading || isLoading ? (
                <Loader />
            ) : (
                <>
                    {requestedInventory.length === 0 ? (
                        <Stack spacing={2} sx={{ py: 4 }}>
                            <Typography variant="body1">Your cart is empty</Typography>
                            <Button variant="outlined" onClick={onContinueBrowsing}>
                                Continue browsing
                            </Button>
                        </Stack>
                    ) : (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>Items to be requested:</Typography>
                            <Stack spacing={1.5}>
                                {requestedInventory.map((inventoryItem, i) => {
                                    if (!inventoryItem.images) return null;
                                    return (
                                        <Card key={i} elevation={2} sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Image
                                                    src={inventoryItem.images[0] as string}
                                                    alt={`${inventoryItem.brand} ${inventoryItem.model}`}
                                                    width={80}
                                                    height={80}
                                                    style={{ objectFit: 'cover', aspectRatio: '1/1', borderRadius: 4 }}
                                                />
                                                <Typography variant="body1">
                                                    {inventoryItem.brand} - {inventoryItem.model}
                                                </Typography>
                                            </Box>
                                            <Button variant="outlined" onClick={() => removeRequestedInventoryItem(i)}>
                                                <DeleteIcon />
                                            </Button>
                                        </Card>
                                    );
                                })}
                            </Stack>
                            {activeUsers ? (
                                <Autocomplete
                                    sx={{ mt: 3, maxWidth: 500 }}
                                    value={selectedUser}
                                    onChange={(_event: any, newValue: string | null) => setSelectedUser(newValue)}
                                    id="requestor-select"
                                    options={activeUsers.map((user) => `${user.displayName} (${user.email})`)}
                                    renderInput={(params) => <TextField {...params} label="Requestor" />}
                                />
                            ) : (
                                <Typography variant="body1" sx={{ mt: 2 }}>Could not load active users.</Typography>
                            )}
                            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                                <Button variant="outlined" onClick={onContinueBrowsing}>
                                    Continue browsing
                                </Button>
                                <Button variant="contained" disabled={!selectedUser} onClick={handleAdminRequestItems}>
                                    Request Items
                                </Button>
                            </Stack>
                        </Box>
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
        </>
    );
}
