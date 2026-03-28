'use client';

//Hooks
import { MouseEventHandler, useEffect, useState, Dispatch, SetStateAction } from 'react';
//APi
import { addErrorEvent } from '@/api/firebase';
import { getDonationById, updateDonation, updateDonationStatus, updateDonationStorage, getStorageDocRef } from '@/api/firebase-donations';
import { productLifeCycleReport } from '@/api/firebase-reports';
import { getActiveStorage, getStorageById } from '@/api/firebase-storage';
//Components
import { Dialog, DialogActions, DialogTitle, DialogContent, ImageList, ImageListItem, Button, Divider, IconButton, Typography, Stack, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import Loader from '@/components/Loader';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import CustomDialog from './CustomDialog';
import EditDonation from '@/components/EditDonation';
//icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import PlaceIcon from '@mui/icons-material/Place';
//Styles
import '@/styles/globalStyles.css';
//Types
import { DonationStatusKeys, donationStatuses, Donation } from '@/models/donation';
import { Storage } from '@/models/storage';

type DonationDetailsProps = {
    id: string | null;
    donation?: Donation;
    setIdToDisplay?: Dispatch<SetStateAction<string | null>>;
    setDonationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const DonationDetails = (props: DonationDetailsProps) => {
    const { id, setIdToDisplay, donation, setDonationsUpdated } = props;
    const intialDonation = donation ? donation : null;
    const [donationDetails, setDonationDetails] = useState<Donation | null>(intialDonation);
    const [donationDetailsUpdated, setDonationDetailsUpdated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isImageOpen, setIsImageOpen] = useState<boolean>(false);
    const [openImageURL, setOpenImageURL] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [dialogContent, setDialogContent] = useState<string>('');
    const [resolvedStorageName, setResolvedStorageName] = useState<string | null>(null);
    const [isStorageDialogOpen, setIsStorageDialogOpen] = useState<boolean>(false);
    const [selectedStorageId, setSelectedStorageId] = useState<string>('');
    const [activeStorageLocations, setActiveStorageLocations] = useState<Storage[]>([]);

    // Resolve storage location name
    useEffect(() => {
        const resolveStorage = async () => {
            if (donationDetails?.storage) {
                try {
                    const storageDoc = await getStorageById(donationDetails.storage.id);
                    setResolvedStorageName(storageDoc.name);
                } catch {
                    setResolvedStorageName('Unknown location');
                }
            } else {
                setResolvedStorageName(null);
            }
        };
        resolveStorage();
    }, [donationDetails?.storage, donationDetailsUpdated]);

    //Status names for select menu
    const statusSelectOptions = Object.keys(donationStatuses);

    async function fetchDonation(id: string) {
        setIsLoading(true);
        try {
            const donationToView = await getDonationById(id);
            setDonationDetails(donationToView);
            setDonationDetailsUpdated(false);
        } catch (error: any) {
            addErrorEvent(`Fetch donation by ID`, error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }

    const removeFromInventory = async (): Promise<void> => {
        setIsLoading(true);
        try {
            if (donationDetails) {
                await updateDonationStatus(donationDetails.id, 'unavailable');
                setDialogContent(`'${donationDetails.brand} - ${donationDetails.model}' has been removed from inventory.`);
                setIsDialogOpen(true);
            }
        } catch (error) {
            addErrorEvent('Error removing donation from inventory', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const addToInventory = async (): Promise<void> => {
        setIsLoading(true);
        try {
            if (donationDetails) {
                await updateDonation(donationDetails.id, {
                    status: 'available'
                });
                setDialogContent(`'${donationDetails.brand} - ${donationDetails.model}' has been added to inventory.`);
                setIsDialogOpen(true);
            }
        } catch (error) {
            addErrorEvent('Error adding donation from inventory', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = async (): Promise<void> => {
        if (donationDetails) await fetchDonation(donationDetails.id);
        setDialogContent('');
        setIsDialogOpen(false);
    };

    const handleOpenStorageDialog = async () => {
        try {
            const locations = await getActiveStorage();
            setActiveStorageLocations(locations);
        } catch (error) {
            addErrorEvent('Error fetching active storage locations', error);
        }
        setIsStorageDialogOpen(true);
    };

    const handleStorageUpdate = async () => {
        if (!selectedStorageId || !donationDetails) return;
        try {
            const storageRef = getStorageDocRef(selectedStorageId);
            const selectedLocation = activeStorageLocations.find((s) => s.id === selectedStorageId);
            // Optimistic update
            setResolvedStorageName(selectedLocation?.name ?? 'Updated');
            setIsStorageDialogOpen(false);
            await updateDonationStorage(donationDetails.id, storageRef);
            setDonationDetailsUpdated(true);
        } catch (error) {
            addErrorEvent('Error updating donation storage', error);
            setResolvedStorageName(null);
        }
    };

    const handleImageClick: MouseEventHandler<HTMLImageElement> = (event) => {
        setOpenImageURL(event.currentTarget.src);
        setIsImageOpen(true);
    };

    const handleImageClose = () => setIsImageOpen(false);

    const generateProductLifeCycleReport = (donation: Donation) => {
        return productLifeCycleReport(donation);
    };

    useEffect(() => {
        if ((id && !donation) || (id && donationDetailsUpdated)) fetchDonation(id);
    }, [donationDetailsUpdated]);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                {!isEditMode ? <h3>Donation Details</h3> : <h3>Edit Donation</h3>}
                {setIdToDisplay && (
                    <IconButton onClick={() => setIdToDisplay(null)}>
                        <ArrowBackIcon />
                    </IconButton>
                )}

                {isLoading && <Loader />}
                {!isLoading && donationDetails === null && <p>Donation not found</p>}
                {!isLoading && donationDetails !== null && !isEditMode && (
                    <div className="content--container">
                        <ImageList>
                            {donationDetails.images.map((image) => (
                                <ImageListItem key={image as string}>
                                    <img src={`${image}`} alt={donationDetails.model} loading="lazy" onClick={handleImageClick} />
                                </ImageListItem>
                            ))}
                        </ImageList>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ marginBottom: '1em' }}>
                            <Button variant="contained" type="button" startIcon={<EditIcon />} onClick={() => setIsEditMode(true)}>
                                Edit Donation
                            </Button>
                            <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => generateProductLifeCycleReport(donationDetails)}>
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
                        </Stack>

                        <Divider sx={{ marginBottom: '1em' }}></Divider>
                        <Typography variant="h5">
                            {donationDetails.brand} - {donationDetails.model}
                        </Typography>
                        {donationDetails.status !== 'rejected' && <Typography variant="h6">{donationDetails.tagNumber ?? 'No tag number'}</Typography>}
                        <Typography variant="body1">
                            <b>Status: </b>
                            {statusSelectOptions.find((key) => donationStatuses[key as DonationStatusKeys] === donationDetails.status)}
                        </Typography>
                        {(donationDetails.status === 'available' || donationDetails.status === 'unavailable') && (
                            <Typography variant="body1">
                                <b>Days in storage: </b>
                                {donationDetails.getDaysInStorage()}
                            </Typography>
                        )}

                        {/* Storage location */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mt: 1 }}>
                            <PlaceIcon sx={{ fontSize: '18px', color: resolvedStorageName ? '#1976d2' : '#bdbdbd' }} />
                            <Typography variant="body1" sx={{ color: resolvedStorageName ? 'inherit' : '#bdbdbd' }}>
                                <b>Storage: </b>
                                {resolvedStorageName ?? 'No storage assigned'}
                            </Typography>
                            <Button
                                size="small"
                                variant="text"
                                sx={{ textTransform: 'none', fontSize: '12px' }}
                                onClick={handleOpenStorageDialog}
                            >
                                Change
                            </Button>
                        </Box>

                        <Typography variant="body1" sx={{ marginTop: '1em' }}>
                            <b>Category: </b> {donationDetails.category}
                        </Typography>

                        <Typography variant="body1">
                            <b>Description: </b>
                            {donationDetails.description}
                        </Typography>
                        {donationDetails.dateAccepted && (
                            <Typography variant="body1">
                                <b>Accepted on: </b>
                                {donationDetails.dateAccepted.toDate().toDateString()}
                            </Typography>
                        )}
                        {(donationDetails.donorEmail.length > 0 || donationDetails.donorName.length > 0) && (
                            <Typography variant="body1">
                                <b>Donated by: </b>
                                {donationDetails.donorName} ({donationDetails.donorEmail})
                            </Typography>
                        )}

                        {donationDetails.dateReceived && (
                            <Typography variant="body1">
                                <b>Received on: </b>
                                {donationDetails.dateReceived.toDate().toDateString()}
                            </Typography>
                        )}
                        {donationDetails.requestor && (
                            <Typography variant="body1">
                                <b>Requested by: </b>
                                {donationDetails.requestor.name}
                            </Typography>
                        )}
                        {donationDetails.dateRequested && (
                            <Typography variant="body1">
                                <b>Requested on: </b>
                                {donationDetails.dateRequested.toDate().toDateString()}
                            </Typography>
                        )}
                        {donationDetails.distributor && (
                            <Typography variant="body1">
                                <b>Distributed by: </b>
                                {donationDetails.distributor.name} ({donationDetails.distributor.email})
                            </Typography>
                        )}
                        {donationDetails.dateDistributed && (
                            <Typography variant="body1">
                                <b>Date distributed: </b>
                                {donationDetails.dateDistributed.toDate().toDateString()}
                            </Typography>
                        )}
                        <Dialog open={isImageOpen} onClose={handleImageClose} sx={{ width: '100%' }}>
                            <img src={openImageURL} alt={openImageURL} style={{ maxWidth: '100%' }} />
                            <DialogActions>
                                <Button type="button" onClick={handleImageClose}>
                                    Close
                                </Button>
                            </DialogActions>
                        </Dialog>
                        <CustomDialog isOpen={isDialogOpen} title="Donation updated" content={dialogContent} onClose={handleClose} />
                        {/* Storage update dialog */}
                        <Dialog open={isStorageDialogOpen} onClose={() => setIsStorageDialogOpen(false)} maxWidth="xs" fullWidth>
                            <DialogTitle>Change Storage Location</DialogTitle>
                            <DialogContent>
                                <FormControl fullWidth sx={{ mt: 1 }}>
                                    <InputLabel id="detail-storage-label">Storage Location</InputLabel>
                                    <Select
                                        labelId="detail-storage-label"
                                        id="detail-storage-select"
                                        value={selectedStorageId}
                                        label="Storage Location"
                                        onChange={(e) => setSelectedStorageId(e.target.value)}
                                    >
                                        {activeStorageLocations.map((loc) => (
                                            <MenuItem key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setIsStorageDialogOpen(false)}>Cancel</Button>
                                <Button variant="contained" onClick={handleStorageUpdate} disabled={!selectedStorageId}>
                                    Save
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </div>
                )}
                {!isLoading && donationDetails && isEditMode && (
                    <EditDonation donationDetails={donationDetails} setIsEditMode={setIsEditMode} setDonationDetailsUpdated={setDonationDetailsUpdated} />
                )}
            </div>
        </ProtectedAdminRoute>
    );
};

export default DonationDetails;
