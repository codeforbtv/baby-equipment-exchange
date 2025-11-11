'use client';

//Hooks
import { MouseEventHandler, useEffect, useState, Dispatch, SetStateAction } from 'react';
//APi
import { addErrorEvent } from '@/api/firebase';
import { getDonationById, updateDonationStatus } from '@/api/firebase-donations';
//Components
import {
    Dialog,
    DialogActions,
    FormControl,
    ImageList,
    ImageListItem,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Button,
    Divider,
    IconButton,
    Typography
} from '@mui/material';
import Loader from '@/components/Loader';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
//icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//Styles
import EditDonation from '@/components/EditDonation';
import '@/styles/globalStyles.css';
//Types
import { IDonation, DonationStatuses, DonationStatusKeys, DonationStatusValues, donationStatuses, Donation } from '@/models/donation';

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

    const initialStatus: DonationStatusValues = donationDetails ? donationDetails.status : 'in processing';

    //Status names for select menu
    const statusSelectOptions = Object.keys(donationStatuses);

    const [selectedStatus, setSelectedStatus] = useState<DonationStatusValues>(initialStatus);

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

    const selectHandler = async (event: SelectChangeEvent) => {
        try {
            if (!donationDetails) return;
            const updatedStatus = event.target.value;
            const result = await updateDonationStatus(donationDetails.id, updatedStatus);
            setSelectedStatus(result);
            //Fetch latest details
            fetchDonation(donationDetails.id);
        } catch (error) {
            addErrorEvent('Error updating donation status', error);
        }
    };

    const handleImageClick: MouseEventHandler<HTMLImageElement> = (event) => {
        setOpenImageURL(event.currentTarget.src);
        setIsImageOpen(true);
    };

    const handleImageClose = () => setIsImageOpen(false);

    useEffect(() => {
        if (id && !donation) fetchDonation(id);
    }, []);

    useEffect(() => {
        setSelectedStatus(initialStatus);
    }, [initialStatus]);

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
                        <Button variant="contained" type="button" onClick={() => setIsEditMode(true)} sx={{ marginBottom: '1em' }}>
                            Edit Donation
                        </Button>
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
