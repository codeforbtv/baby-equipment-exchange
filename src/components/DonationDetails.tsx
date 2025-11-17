'use client';

//Hooks
import { MouseEventHandler, useEffect, useState, Dispatch, SetStateAction } from 'react';
//APi
import { addErrorEvent } from '@/api/firebase';
import { getDonationById, updateDonationStatus } from '@/api/firebase-donations';
//Components
import { Dialog, DialogActions, ImageList, ImageListItem, Button, Divider, IconButton, Typography, Stack } from '@mui/material';
import Loader from '@/components/Loader';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import CustomDialog from './CustomDialog';
import EditDonation from '@/components/EditDonation';
//icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';
//Styles
import '@/styles/globalStyles.css';
//Types
import { DonationStatusKeys, donationStatuses, Donation } from '@/models/donation';

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
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isImageOpen, setIsImageOpen] = useState<boolean>(false);
    const [openImageURL, setOpenImageURL] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [dialogContent, setDialogContent] = useState<string>('');

    //Status names for select menu
    const statusSelectOptions = Object.keys(donationStatuses);

    async function fetchDonation(id: string) {
        setIsLoading(true);
        try {
            const donationToView = await getDonationById(id);
            setDonationDetails(donationToView);
        } catch (error: any) {
            addErrorEvent(`Fetch donation by ID`, error);
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
        } finally {
            setIsLoading(false);
        }
    };

    const addToInventory = async (): Promise<void> => {
        setIsLoading(true);
        try {
            if (donationDetails) {
                await updateDonationStatus(donationDetails.id, 'available');
                setDialogContent(`'${donationDetails.brand} - ${donationDetails.model}' has been added to inventory.`);
                setIsDialogOpen(true);
            }
        } catch (error) {
            addErrorEvent('Error adding donation from inventory', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = async (): Promise<void> => {
        if (donationDetails) await fetchDonation(donationDetails.id);
        if (setDonationsUpdated) setDonationsUpdated(true);
        setDialogContent('');
        setIsDialogOpen(false);
    };

    const handleImageClick: MouseEventHandler<HTMLImageElement> = (event) => {
        setOpenImageURL(event.currentTarget.src);
        setIsImageOpen(true);
    };

    const handleImageClose = () => setIsImageOpen(false);

    useEffect(() => {
        if (id && !donation) fetchDonation(id);
    }, []);

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
                        <Stack direction="row" spacing={2} sx={{ marginBottom: '1em' }}>
                            <Button variant="contained" type="button" startIcon={<EditIcon />} onClick={() => setIsEditMode(true)}>
                                Edit Donation
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
                        <Typography variant="body1">
                            <b>Donated by: </b>
                            {donationDetails.donorEmail}
                        </Typography>
                        {donationDetails.dateReceived && (
                            <Typography variant="body1">
                                <b>Recieved on: </b>
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
                    </div>
                )}
                {!isLoading && donationDetails && isEditMode && (
                    <EditDonation
                        donationDetails={donationDetails}
                        setIsEditMode={setIsEditMode}
                        fetchDonation={fetchDonation}
                        setDonationsUpdated={setDonationsUpdated && setDonationsUpdated}
                    />
                )}
            </div>
        </ProtectedAdminRoute>
    );
};

export default DonationDetails;
