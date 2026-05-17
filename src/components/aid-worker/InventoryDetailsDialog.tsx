'use client';

import { Dialog, DialogContent, DialogActions, Button, IconButton, ImageList, ImageListItem, Typography, Box, DialogTitle } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { InventoryItem } from '@/models/inventoryItem';
import posthog from 'posthog-js';

type InventoryDetailsDialogProps = {
    open: boolean;
    item: InventoryItem | null;
    onClose: () => void;
};

export default function InventoryDetailsDialog({ open, item, onClose }: InventoryDetailsDialogProps) {
    const { addRequestedInventoryItem } = useRequestedInventoryContext();

    if (!item) return null;

    const handleAdd = () => {
        addRequestedInventoryItem(item);
        posthog.capture('inventory_item_added_to_cart', { item_id: item.id, category: item.category });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Item Details
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {item.images && item.images.length > 0 && (
                    <ImageList cols={item.images.length > 1 ? 2 : 1} gap={8} sx={{ mb: 2 }}>
                        {item.images.map((image) => (
                            <ImageListItem key={image as string}>
                                <img
                                    src={image as string}
                                    alt={item.model}
                                    loading="lazy"
                                    style={{ borderRadius: 4, maxHeight: 300, objectFit: 'cover' }}
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="h6">{item.brand} {item.model}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        <b>Tag number:</b> {item.tagNumber ?? 'No tag'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <b>Category:</b> {item.category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <b>Status:</b> {item.status}
                    </Typography>
                    {item.description && (
                        <Typography variant="body2" sx={{ mt: 1 }}>{item.description}</Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose}>Close</Button>
                <Button
                    variant="contained"
                    startIcon={<AddShoppingCartIcon />}
                    onClick={handleAdd}
                    disabled={item.status !== 'available'}
                >
                    Add to cart
                </Button>
            </DialogActions>
        </Dialog>
    );
}
