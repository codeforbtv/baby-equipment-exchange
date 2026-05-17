'use client';

import { MouseEventHandler, useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Typography,
    Box,
    Chip,
    ImageList,
    ImageListItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { getStatusChipProps } from '@/utils/statusChipProps';
import { getInventoryItemById } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';
import Loader from './Loader';
import { InventoryItem } from '@/models/inventoryItem';

type InventoryDetailsDialogProps = {
    open: boolean;
    item: InventoryItem | null;
    onClose: () => void;
    handleRequestInventoryItem: (item: InventoryItem) => void;
};

export default function InventoryDetailsDialog({ open, item, onClose, handleRequestInventoryItem }: InventoryDetailsDialogProps) {
    const [itemDetails, setItemDetails] = useState<InventoryItem | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isImageOpen, setIsImageOpen] = useState(false);
    const [openImageURL, setOpenImageURL] = useState('');

    useEffect(() => {
        if (open && item) {
            setItemDetails(item);
        }
        if (!open) {
            setIsImageOpen(false);
        }
    }, [open, item]);

    async function fetchItem(id: string) {
        setIsLoading(true);
        try {
            const fetched = await getInventoryItemById(id);
            setItemDetails(fetched);
        } catch (error) {
            addErrorEvent('Fetch inventory item by ID', error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (open && item && !item.images?.length) {
            fetchItem(item.id);
        }
    }, [open, item]);

    const handleImageClick: MouseEventHandler<HTMLImageElement> = (event) => {
        setOpenImageURL(event.currentTarget.src);
        setIsImageOpen(true);
    };

    const handleAdd = () => {
        if (itemDetails && itemDetails.status === 'available') {
            handleRequestInventoryItem(itemDetails);
            onClose();
        }
    };

    if (!item) return null;

    const details = itemDetails || item;
    const statusChip = getStatusChipProps(details.status);
    const canRequest = details.status === 'available';

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
                    {isLoading && <Loader />}
                    {!isLoading && (
                        <>
                            {details.images && (details.images as string[]).length > 0 && (
                                <ImageList cols={(details.images as string[]).length > 1 ? 2 : 1} gap={8} sx={{ mb: 2 }}>
                                    {(details.images as string[]).map((image) => (
                                        <ImageListItem key={image}>
                                            <img
                                                src={image}
                                                alt={details.model}
                                                loading="lazy"
                                                onClick={handleImageClick}
                                                style={{ borderRadius: 4, maxHeight: 300, objectFit: 'cover', cursor: 'pointer' }}
                                            />
                                        </ImageListItem>
                                    ))}
                                </ImageList>
                            )}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="h6">{details.brand} {details.model}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    <b>Tag number:</b> {details.tagNumber ?? 'No tag'}
                                </Typography>
                                <Box>
                                    <Chip size="small" label={statusChip.label} color={statusChip.color} />
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    <b>Category:</b> {details.category}
                                </Typography>
                                {details.description && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>{details.description}</Typography>
                                )}
                            </Box>
                        </>
                    )}
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
