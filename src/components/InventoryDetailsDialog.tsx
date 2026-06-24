'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Stack, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ImageGallery from './ImageGallery';
import { getStatusChipProps } from '@/utils/statusChipProps';
import { InventoryItem } from '@/models/inventoryItem';

type InventoryDetailsDialogProps = {
    open: boolean;
    item: InventoryItem | null;
    onClose: () => void;
    handleRequestInventoryItem?: (item: InventoryItem) => void;
    readOnly?: boolean;
};

export default function InventoryDetailsDialog({ open, item, onClose, handleRequestInventoryItem, readOnly = false }: InventoryDetailsDialogProps) {
    if (!item) return null;

    const images = item.images as string[];
    const canRequest = item.status === 'available';
    const statusChip = getStatusChipProps(item.status);

    const handleAdd = () => {
        if (!handleRequestInventoryItem) return;
        handleRequestInventoryItem(item);
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
                <ImageGallery images={images} alt={item.model} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    {item.brand} {item.model}
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                    <Typography variant="body2">
                        <b>Tag number:</b> {item.tagNumber ?? 'No tag'}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" color={statusChip.color} label={statusChip.label} sx={{ fontWeight: 600 }} />
                        <Typography variant="body2" color="text.secondary">
                            {item.category}
                        </Typography>
                    </Stack>
                    {item.description && (
                        <Typography variant="body2">
                            <b>Description:</b> {item.description}
                        </Typography>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose}>Close</Button>
                {!readOnly && handleRequestInventoryItem && (
                    <Button
                        variant="contained"
                        startIcon={<AddShoppingCartIcon />}
                        onClick={handleAdd}
                        disabled={!canRequest}
                    >
                        Add to order
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
