'use client';

import { MouseEventHandler, useEffect, useState, Dispatch, SetStateAction } from 'react';
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
    Divider,
    ImageList,
    ImageListItem,
    Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DownloadIcon from '@mui/icons-material/Download';
import Loader from '@/components/Loader';
import CustomDialog from '@/components/CustomDialog';
import EditDonation from '@/components/EditDonation';
import { getDonationById, updateDonation, updateDonationStatus } from '@/api/firebase-donations';
import { productLifeCycleReport } from '@/api/firebase-reports';
import { addErrorEvent } from '@/api/firebase';
import { getStatusChipProps } from '@/utils/statusChipProps';
import { Donation } from '@/models/donation';

type DonationDetailsDialogProps = {
    open: boolean;
    donation: Donation | null;
    onClose: () => void;
    setDonationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

export default function DonationDetailsDialog({ open, donation, onClose, setDonationsUpdated }: DonationDetailsDialogProps) {
    const [donationDetails, setDonationDetails] = useState<Donation | null>(null);
    const [donationDetailsUpdated, setDonationDetailsUpdated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isImageOpen, setIsImageOpen] = useState(false);
    const [openImageURL, setOpenImageURL] = useState('');
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState('');

    async function fetchDonation(id: string) {
        setIsLoading(true);
        try {
            const donationToView = await getDonationById(id);
            setDonationDetails(donationToView);
            setDonationDetailsUpdated(false);
        } catch (error) {
            addErrorEvent('Fetch donation by ID', error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (open && donation) {
            setDonationDetails(donation);
            setIsEditMode(false);
            setDonationDetailsUpdated(false);
        }
        if (!open) {
            setDonationDetails(null);
            setIsEditMode(false);
        }
    }, [open, donation]);

    useEffect(() => {
        if (donationDetailsUpdated && donationDetails) {
            fetchDonation(donationDetails.id);
            if (setDonationsUpdated) setDonationsUpdated(true);
        }
    }, [donationDetailsUpdated]);

    const removeFromInventory = async () => {
        if (!donationDetails) return;
        setIsLoading(true);
        try {
            await updateDonationStatus(donationDetails.id, 'unavailable');
            setDialogContent(`'${donationDetails.brand} - ${donationDetails.model}' has been removed from inventory.`);
            setIsConfirmDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error removing donation from inventory', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addToInventory = async () => {
        if (!donationDetails) return;
        setIsLoading(true);
        try {
            await updateDonation(donationDetails.id, { status: 'available' });
            setDialogContent(`'${donationDetails.brand} - ${donationDetails.model}' has been added to inventory.`);
            setIsConfirmDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error adding donation to inventory', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetToInProcessing = async () => {
        if (!donationDetails) return;
        setIsLoading(true);
        try {
            await updateDonationStatus(donationDetails.id, 'in processing');
            await updateDonation(donationDetails.id, { dateAccepted: null, tagNumber: null });
            setDialogContent(`'${donationDetails.brand} - ${donationDetails.model}' has been returned to the approval queue.`);
            setIsConfirmDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error resetting donation to in processing', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmClose = async () => {
        if (donationDetails) await fetchDonation(donationDetails.id);
        setDialogContent('');
        setIsConfirmDialogOpen(false);
        if (setDonationsUpdated) setDonationsUpdated(true);
    };

    const handleImageClick: MouseEventHandler<HTMLImageElement> = (event) => {
        setOpenImageURL(event.currentTarget.src);
        setIsImageOpen(true);
    };

    const statusChip = donationDetails ? getStatusChipProps(donationDetails.status) : null;

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth={isEditMode ? 'lg' : 'md'}
                fullWidth
                scroll="paper"
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {isEditMode ? 'Edit Donation' : 'Donation Details'}
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    {isLoading && <Loader />}

                    {!isLoading && !donationDetails && <Typography>Donation not found</Typography>}

                    {!isLoading && donationDetails && !isEditMode && (
                        <Box>
                            {donationDetails.images.length > 0 && (
                                <ImageList cols={Math.min(donationDetails.images.length, 3)} gap={8} sx={{ mb: 2 }}>
                                    {donationDetails.images.map((image) => (
                                        <ImageListItem key={image as string}>
                                            <img
                                                src={`${image}`}
                                                alt={donationDetails.model}
                                                loading="lazy"
                                                onClick={handleImageClick}
                                                style={{ cursor: 'pointer', borderRadius: 4 }}
                                            />
                                        </ImageListItem>
                                    ))}
                                </ImageList>
                            )}

                            <Typography variant="h5" gutterBottom>
                                {donationDetails.brand} - {donationDetails.model}
                            </Typography>

                            {donationDetails.status !== 'rejected' && (
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    {donationDetails.tagNumber ?? 'No tag number'}
                                </Typography>
                            )}

                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                {statusChip && <Chip label={statusChip.label} color={statusChip.color} size="small" />}
                                {(donationDetails.status === 'available' || donationDetails.status === 'unavailable') &&
                                    donationDetails.getDaysInStorage() !== undefined && (
                                        <Typography variant="body2" color="text.secondary">
                                            {donationDetails.getDaysInStorage()} days in storage
                                        </Typography>
                                    )}
                            </Stack>

                            <Divider sx={{ my: 2 }} />

                            <Stack spacing={0.75}>
                                <Typography variant="body1">
                                    <b>Category:</b> {donationDetails.category}
                                </Typography>
                                {donationDetails.description && (
                                    <Typography variant="body1">
                                        <b>Description:</b> {donationDetails.description}
                                    </Typography>
                                )}
                                {donationDetails.dateAccepted && (
                                    <Typography variant="body1">
                                        <b>Accepted on:</b> {donationDetails.dateAccepted.toDate().toDateString()}
                                    </Typography>
                                )}
                                {(donationDetails.donorEmail?.length > 0 || donationDetails.donorName?.length > 0) && (
                                    <Typography variant="body1">
                                        <b>Donated by:</b> {donationDetails.donorName} ({donationDetails.donorEmail})
                                    </Typography>
                                )}
                                {donationDetails.dateReceived && (
                                    <Typography variant="body1">
                                        <b>Received on:</b> {donationDetails.dateReceived.toDate().toDateString()}
                                    </Typography>
                                )}
                                {donationDetails.requestor && (
                                    <Typography variant="body1">
                                        <b>Requested by:</b> {donationDetails.requestor.name}
                                    </Typography>
                                )}
                                {donationDetails.dateRequested && (
                                    <Typography variant="body1">
                                        <b>Requested on:</b> {donationDetails.dateRequested.toDate().toDateString()}
                                    </Typography>
                                )}
                                {donationDetails.distributor && (
                                    <Typography variant="body1">
                                        <b>Distributed by:</b> {donationDetails.distributor.name} ({donationDetails.distributor.email})
                                    </Typography>
                                )}
                                {donationDetails.dateDistributed && (
                                    <Typography variant="body1">
                                        <b>Date distributed:</b> {donationDetails.dateDistributed.toDate().toDateString()}
                                    </Typography>
                                )}
                            </Stack>

                            <Divider sx={{ my: 2 }} />

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
                                <Button variant="contained" startIcon={<EditIcon />} onClick={() => setIsEditMode(true)}>
                                    Edit Donation
                                </Button>
                                <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => productLifeCycleReport(donationDetails)}>
                                    Lifecycle Report
                                </Button>
                                {donationDetails.status === 'available' && (
                                    <Button variant="contained" startIcon={<RemoveCircleOutlineIcon />} color="error" onClick={removeFromInventory}>
                                        Remove from inventory
                                    </Button>
                                )}
                                {donationDetails.status === 'unavailable' && (
                                    <Button variant="contained" startIcon={<AddIcon />} color="error" onClick={addToInventory}>
                                        Add to inventory
                                    </Button>
                                )}
                                {donationDetails.status !== 'in processing' && donationDetails.status !== 'distributed' && (
                                    <Button variant="outlined" startIcon={<RestartAltIcon />} color="warning" onClick={resetToInProcessing}>
                                        Return to Approval Queue
                                    </Button>
                                )}
                            </Stack>
                        </Box>
                    )}

                    {!isLoading && donationDetails && isEditMode && (
                        <EditDonation
                            donationDetails={donationDetails}
                            setIsEditMode={setIsEditMode}
                            setDonationDetailsUpdated={setDonationDetailsUpdated}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isImageOpen} onClose={() => setIsImageOpen(false)} maxWidth="lg">
                <img src={openImageURL} alt="" style={{ maxWidth: '100%' }} />
                <DialogActions>
                    <Button onClick={() => setIsImageOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <CustomDialog isOpen={isConfirmDialogOpen} title="Donation updated" content={dialogContent} onClose={handleConfirmClose} />
        </>
    );
}
