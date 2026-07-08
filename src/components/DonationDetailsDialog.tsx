'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Typography,
    Stack,
    Chip,
    Box,
    TextField,
    Autocomplete
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ImageGallery from './ImageGallery';
import ImageThumbnail from './ImageThumbnail';
import Loader from './Loader';
import { getStatusChipProps } from '@/utils/statusChipProps';
import { getDonationById, updateDonation, updateDonationStatus } from '@/api/firebase-donations';
import { getAllCategories, getTagNumber } from '@/api/firebase-categories';
import { uploadImages } from '@/api/firebase-images';
import { productLifeCycleReport } from '@/api/firebase-reports';
import { appendImagesToState, removeImageFromState } from '@/controllers/images';
import { addErrorEvent } from '@/api/firebase';
import { Donation } from '@/models/donation';
import { Category } from '@/models/category';

type DonationDetailsDialogProps = {
    open: boolean;
    donation: Donation | null;
    onClose: () => void;
    onUpdated?: () => void;
    readOnly?: boolean;
};

const detailRow = (label: string, value: string) => (
    <Typography variant="body2">
        <b>{label}: </b>
        {value}
    </Typography>
);

export default function DonationDetailsDialog({ open, donation, onClose, onUpdated, readOnly = false }: DonationDetailsDialogProps) {
    const [details, setDetails] = useState<Donation | null>(donation);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[] | null>(null);
    const [newCategory, setNewCategory] = useState<string | null>(null);
    const [newTagNumber, setNewTagnumber] = useState<string | undefined | null>(null);
    const [newBrand, setNewBrand] = useState<string>('');
    const [newModel, setNewModel] = useState<string>('');
    const [newDescription, setNewDescription] = useState<string>('');
    const [newImages, setNewImages] = useState<string[]>([]);
    const [addedImages, setAddedImages] = useState<File[] | null>();

    useEffect(() => {
        setDetails(donation);
        setIsEditMode(false);
    }, [donation?.id]);

    if (!details) return null;

    const statusChip = getStatusChipProps(details.status);

    const refetchDetails = async (): Promise<void> => {
        try {
            const updated = await getDonationById(details.id);
            setDetails(updated);
        } catch (error) {
            addErrorEvent('Fetch donation by ID', error);
        }
    };

    const removeFromInventory = async (): Promise<void> => {
        setIsLoading(true);
        try {
            await updateDonationStatus(details.id, 'unavailable');
            await refetchDetails();
            onUpdated?.();
        } catch (error) {
            addErrorEvent('Error removing donation from inventory', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addToInventory = async (): Promise<void> => {
        setIsLoading(true);
        try {
            await updateDonation(details.id, { status: 'available' });
            await refetchDetails();
            onUpdated?.();
        } catch (error) {
            addErrorEvent('Error adding donation to inventory', error);
        } finally {
            setIsLoading(false);
        }
    };

    const enterEditMode = async (): Promise<void> => {
        setNewCategory(details.category);
        setNewTagnumber(details.tagNumber);
        setNewBrand(details.brand);
        setNewModel(details.model);
        setNewDescription(details.description ?? '');
        setNewImages(details.images);
        setAddedImages(null);
        setIsEditMode(true);
        if (!categories) {
            try {
                setIsLoading(true);
                const categoriesResult = await getAllCategories();
                setCategories(categoriesResult);
            } catch (error) {
                addErrorEvent('Error fetching all categories: ', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const assignTagNumber = async (): Promise<void> => {
        if (newCategory) {
            const assignedTagNumber = await getTagNumber(newCategory);
            setNewTagnumber(assignedTagNumber);
        }
    };

    const handleSaveChanges = async (): Promise<void> => {
        setIsLoading(true);
        try {
            let addedImageUrls: string[] = [];
            if (addedImages) {
                addedImageUrls = await uploadImages(addedImages);
            }
            await updateDonation(details.id, {
                category: newCategory,
                tagNumber: newTagNumber ?? '',
                brand: newBrand,
                model: newModel,
                description: newDescription,
                images: [...addedImageUrls, ...newImages]
            });
            await refetchDetails();
            setIsEditMode(false);
            onUpdated?.();
        } catch (error) {
            addErrorEvent('Error submitting donation update', error);
        } finally {
            setIsLoading(false);
        }
    };

    const canSave = (addedImages != null && addedImages.length > 0) || newImages.length > 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isEditMode ? 'Edit Donation' : 'Donation Details'}
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {isLoading && <Loader />}
                {!isLoading && !isEditMode && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '300px 1fr' }, gap: 3 }}>
                        <Box>
                            <ImageGallery images={details.images} alt={details.model} />
                        </Box>
                        <Box>
                            <Typography variant="h6">
                                {details.brand} {details.model}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, mb: 1.5 }}>
                                <Chip size="small" color={statusChip.color} label={statusChip.label} sx={{ fontWeight: 600, ...statusChip.sx }} />
                                {details.status !== 'rejected' && <Chip size="small" label={details.tagNumber ?? 'No tag number'} />}
                            </Stack>
                            <Stack spacing={0.75}>
                                {detailRow('Category', details.category)}
                                {details.description && detailRow('Description', details.description)}
                                {(details.status === 'available' || details.status === 'unavailable') &&
                                    detailRow('Days in storage', String(details.getDaysInStorage() ?? 'Unknown'))}
                                {(details.donorEmail.length > 0 || details.donorName.length > 0) &&
                                    detailRow('Donated by', `${details.donorName} (${details.donorEmail})`)}
                                {details.dateAccepted && detailRow('Accepted on', details.dateAccepted.toDate().toDateString())}
                                {details.dateReceived && detailRow('Received on', details.dateReceived.toDate().toDateString())}
                                {details.requestor && detailRow('Requested by', `${details.requestor.name} (${details.requestor.email})`)}
                                {details.dateRequested && detailRow('Requested on', details.dateRequested.toDate().toDateString())}
                                {details.distributor && detailRow('Distributed by', `${details.distributor.name} (${details.distributor.email})`)}
                                {details.dateDistributed && detailRow('Date distributed', details.dateDistributed.toDate().toDateString())}
                            </Stack>
                        </Box>
                    </Box>
                )}
                {!isLoading && isEditMode && categories && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '300px 1fr' }, gap: 3 }}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Images
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                {newImages.map((image) => (
                                    <ImageThumbnail
                                        key={image}
                                        url={image}
                                        width={'32%'}
                                        margin={'.66%'}
                                        removeFromDb={() => setNewImages(newImages.filter((existing) => existing !== image))}
                                    />
                                ))}
                                {addedImages &&
                                    addedImages.map((image) => (
                                        <ImageThumbnail
                                            key={image.name}
                                            file={image}
                                            width={'32%'}
                                            margin={'.66%'}
                                            removeFromState={(fileToRemove: File) => removeImageFromState(addedImages, setAddedImages, fileToRemove)}
                                        />
                                    ))}
                            </Box>
                            <label htmlFor="dialog-edit-images">
                                <input
                                    type="file"
                                    id="dialog-edit-images"
                                    name="images"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => appendImagesToState(addedImages, setAddedImages, event)}
                                    multiple
                                />
                                <Button variant="contained" component="span" endIcon={<AddPhotoAlternateIcon />} sx={{ mt: 1 }}>
                                    Add Image
                                </Button>
                            </label>
                        </Box>
                        <Stack spacing={2} sx={{ mt: 0.5 }}>
                            <Autocomplete
                                disablePortal
                                options={categories.map((option) => option.name)}
                                renderInput={(params) => <TextField {...params} label="Category" />}
                                value={newCategory}
                                onChange={(_event, newValue) => setNewCategory(newValue)}
                                aria-label="Category"
                            />
                            {details.status !== 'rejected' && (
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        type="text"
                                        label="Tag Number"
                                        name="tagNumber"
                                        id="dialog-edit-tagNumber"
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>): void => setNewTagnumber(event.target.value)}
                                        value={newTagNumber ?? ''}
                                    />
                                    <Button variant="text" type="button" onClick={assignTagNumber}>
                                        Generate New Tag Number
                                    </Button>
                                </Stack>
                            )}
                            <TextField
                                type="text"
                                label="Brand"
                                name="brand"
                                id="dialog-edit-brand"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>): void => setNewBrand(event.target.value)}
                                value={newBrand}
                                required
                            />
                            <TextField
                                type="text"
                                label="Model"
                                name="model"
                                id="dialog-edit-model"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>): void => setNewModel(event.target.value)}
                                value={newModel}
                                required
                            />
                            <TextField
                                multiline={true}
                                type="text"
                                label="Description"
                                name="description"
                                id="dialog-edit-description"
                                rows={3}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>): void => setNewDescription(event.target.value)}
                                value={newDescription}
                                required
                            />
                        </Stack>
                    </Box>
                )}
                {!isLoading && isEditMode && !categories && (
                    <Typography variant="body1">Could not load edit donation form. Please try again later.</Typography>
                )}
            </DialogContent>
            {isEditMode ? (
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setIsEditMode(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleSaveChanges} disabled={isLoading || !canSave}>
                        Save changes
                    </Button>
                </DialogActions>
            ) : readOnly ? (
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose}>Close</Button>
                </DialogActions>
            ) : (
                <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Button startIcon={<DownloadIcon />} onClick={() => productLifeCycleReport(details)}>
                        Lifecycle Report
                    </Button>
                    {details.status === 'available' && (
                        <Button startIcon={<RemoveCircleOutlineIcon />} color="error" onClick={removeFromInventory} disabled={isLoading}>
                            Remove from inventory
                        </Button>
                    )}
                    {details.status === 'unavailable' && (
                        <Button startIcon={<AddIcon />} onClick={addToInventory} disabled={isLoading}>
                            Add to inventory
                        </Button>
                    )}
                    <Button variant="contained" startIcon={<EditIcon />} onClick={enterEditMode} disabled={isLoading}>
                        Edit
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </DialogActions>
            )}
        </Dialog>
    );
}
