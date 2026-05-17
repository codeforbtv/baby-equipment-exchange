'use client';

import { useState } from 'react';
import { Box, Button, Card, Typography, Stack, Snackbar, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { useUserContext } from '@/contexts/UserContext';
import { getAuthIdToken, addErrorEvent } from '@/api/firebase';
import { requestInventory } from '@/app/actions/firebase';
import CustomDialog from '@/components/CustomDialog';
import Loader from '../Loader';
import posthog from 'posthog-js';

type CartTabProps = {
    onContinueBrowsing: () => void;
    onSubmitted: () => void;
};

export default function CartTab({ onContinueBrowsing, onSubmitted }: CartTabProps) {
    const { requestedInventory, removeRequestedInventoryItem, clearRequestedInventory } = useRequestedInventoryContext();
    const { currentUser } = useUserContext();
    const [loading, setLoading] = useState(false);
    const [snackOpen, setSnackOpen] = useState(false);
    const [isUnavailableDialogOpen, setIsUnavailableDialogOpen] = useState(false);
    const [unavailableDialogContent, setUnavailableDialogContent] = useState('');

    const handleRequestItems = async () => {
        if (!requestedInventory || requestedInventory.length === 0 || !currentUser) return;
        setLoading(true);
        try {
            const requestedItemIds = requestedInventory.map((item) => item.id);
            const result = await requestInventory({
                idToken: await getAuthIdToken(),
                donationIds: requestedItemIds,
                user: {
                    name: currentUser.displayName ?? '',
                    email: currentUser.email ?? ''
                }
            });

            if ('unavailableIds' in result) {
                const unavailableItems = requestedInventory.filter((item) => result.unavailableIds.includes(item.id));
                let content = 'The following items are no longer available: ';
                unavailableItems.forEach((item, i) => {
                    content += i < unavailableItems.length - 1
                        ? `"${item.brand} ${item.model}," `
                        : `"${item.brand} ${item.model}." `;
                });
                content += 'Please remove them from your cart and try again.';
                setUnavailableDialogContent(content);
                setIsUnavailableDialogOpen(true);
                return;
            }

            posthog.capture('inventory_items_requested', {
                item_count: requestedItemIds.length,
                item_ids: requestedItemIds
            });
            clearRequestedInventory();
            localStorage.removeItem('requestedInventory');
            setSnackOpen(true);
            setTimeout(() => onSubmitted(), 1500);
        } catch (error) {
            addErrorEvent('Handle request items', error);
            posthog.captureException(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    if (requestedInventory.length === 0) {
        return (
            <Stack spacing={2} sx={{ py: 4, alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary">Your cart is empty</Typography>
                <Button variant="outlined" onClick={onContinueBrowsing}>Continue browsing</Button>
            </Stack>
        );
    }

    return (
        <>
            <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Items to be requested:</Typography>
                <Stack spacing={2}>
                    {requestedInventory.map((item, i) => (
                        <Card key={i} elevation={2} sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {item.images && item.images[0] && (
                                    <Image
                                        src={item.images[0] as string}
                                        alt={`${item.brand} ${item.model}`}
                                        width={60}
                                        height={60}
                                        style={{ objectFit: 'cover', borderRadius: 4 }}
                                    />
                                )}
                                <Typography variant="body1">{item.brand} {item.model}</Typography>
                            </Box>
                            <IconButton onClick={() => removeRequestedInventoryItem(i)} color="error">
                                <DeleteIcon />
                            </IconButton>
                        </Card>
                    ))}
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                    <Button variant="outlined" onClick={onContinueBrowsing}>Continue browsing</Button>
                    <Button variant="contained" onClick={handleRequestItems}>Submit request</Button>
                </Stack>
            </Box>

            <CustomDialog
                isOpen={isUnavailableDialogOpen}
                onClose={() => setIsUnavailableDialogOpen(false)}
                title="Item(s) no longer available."
                content={unavailableDialogContent}
            />

            <Snackbar
                open={snackOpen}
                autoHideDuration={4000}
                onClose={() => setSnackOpen(false)}
                message="Request submitted successfully!"
                action={
                    <IconButton size="small" color="inherit" onClick={() => setSnackOpen(false)}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                }
            />
        </>
    );
}
