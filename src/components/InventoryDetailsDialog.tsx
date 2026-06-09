'use client';

import { MouseEventHandler, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    ImageList,
    ImageListItem,
    Typography,
    Stack,
    Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { getStatusChipProps } from '@/utils/statusChipProps';
import { InventoryItem } from '@/models/inventoryItem';

type InventoryDetailsDialogProps = {
    open: boolean;
    item: InventoryItem | null;
    onClose: () => void;
    handleRequestInventoryItem: (item: InventoryItem) => void;
};

export default function InventoryDetailsDialog({ open, item, onClose, handleRequestInventoryItem }: InventoryDetailsDialogProps) {
    const [isImageOpen, setIsImageOpen] = useState(false);
    const [openImageURL, setOpenImageURL] = useState('');

    if (!item) return null;

    const images = item.images as string[];
    const canRequest = item.status === 'available';
    const statusChip = getStatusChipProps(item.status);

    const handleImageClick: MouseEventHandler<HTMLImageElement> = (event) => {
        setOpenImageURL(event.currentTarget.src);
        setIsImageOpen(true);
    };

    const handleAdd = () => {
        handleRequestInventoryItem(item);
        onClose();
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Item Details
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <ImageList cols={images.length === 1 ? 1 : 2} gap={8}>
                        {images.map((image) => (
                            <ImageListItem key={image}>
                                <img
                                    src={image}
                                    alt={item.model}
                                    loading="lazy"
                                    onClick={handleImageClick}
                                    style={{ cursor: 'pointer' }}
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
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
                    <Button
                        variant="contained"
                        startIcon={<AddShoppingCartIcon />}
                        onClick={handleAdd}
                        disabled={!canRequest}
                    >
                        Add to order
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isImageOpen} onClose={() => setIsImageOpen(false)}>
                <img src={openImageURL} alt="Full size" style={{ maxWidth: '100%' }} />
                <DialogActions>
                    <Button onClick={() => setIsImageOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
