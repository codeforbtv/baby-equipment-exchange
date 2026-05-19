'use client';

//Hooks
import {
    MouseEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useState,
    Dispatch,
    SetStateAction
} from 'react';
//APi
import { addErrorEvent } from '@/api/firebase';
import {
    deleteInventoryDonationById,
    getDonationById,
    updateDonation,
    updateInventoryDonationStatus
} from '@/api/firebase-donations';
import { productLifeCycleReport } from '@/api/firebase-reports';
//Components
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    ImageList,
    ImageListItem,
    Button,
    Divider,
    IconButton,
    Typography,
    Stack
} from '@mui/material';
import Loader from '@/components/Loader';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import CustomDialog from './CustomDialog';
import EditDonation from '@/components/EditDonation';
//icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
//Styles
import '@/styles/globalStyles.css';
//Types
import { donationStatuses, Donation } from '@/models/donation';

type DonationDetailsProps = {
    id: string | null;
    donation?: Donation;
    setIdToDisplay?: Dispatch<SetStateAction<string | null>>;
    setDonationsUpdated?: Dispatch<SetStateAction<boolean>>;
    onDonationChanged?: (donation: Donation) => void;
    onDonationDeleted?: (id: string) => void;
    onClose?: () => void;
};

const DonationDetails = (props: DonationDetailsProps) => {
    const {
        id,
        setIdToDisplay,
        donation,
        setDonationsUpdated,
        onDonationChanged,
        onDonationDeleted,
        onClose
    } = props;
    const intialDonation = donation ? donation : null;
    const [donationDetails, setDonationDetails] = useState<Donation | null>(
        intialDonation
    );
    const [donationDetailsUpdated, setDonationDetailsUpdated] =
        useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [actionInProgress, setActionInProgress] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isImageOpen, setIsImageOpen] = useState<boolean>(false);
    const [openImageURL, setOpenImageURL] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] =
        useState<boolean>(false);
    const [dialogContent, setDialogContent] = useState<string>('');

    const statusLabelByValue = useMemo(() => {
        return Object.fromEntries(
            Object.entries(donationStatuses).map(([label, value]) => [
                value,
                label
            ])
        );
    }, []);

    const fetchDonation = useCallback(
        async (
            donationId: string,
            options: { showLoader?: boolean; notifyParent?: boolean } = {}
        ) => {
            const showLoader = options.showLoader ?? true;
            if (showLoader) {
                setIsLoading(true);
            }
            try {
                const donationToView = await getDonationById(donationId);
                setDonationDetails(donationToView);
                if (options.notifyParent) {
                    onDonationChanged?.(donationToView);
                    setDonationsUpdated?.(true);
                }
                setDonationDetailsUpdated(false);
            } catch (error: any) {
                addErrorEvent(`Fetch donation by ID`, error);
                throw error;
            } finally {
                if (showLoader) {
                    setIsLoading(false);
                }
            }
        },
        [onDonationChanged, setDonationsUpdated]
    );

    const removeFromInventory = async (): Promise<void> => {
        setActionInProgress(true);
        try {
            if (donationDetails) {
                await updateInventoryDonationStatus({
                    id: donationDetails.id,
                    expectedStatus: 'available',
                    nextStatus: 'unavailable'
                });
                await fetchDonation(donationDetails.id, {
                    showLoader: false,
                    notifyParent: true
                });
                setDialogContent(
                    `'${donationDetails.brand} - ${donationDetails.model}' has been removed from inventory.`
                );
                setIsDialogOpen(true);
            }
        } catch (error) {
            addErrorEvent('Error removing donation from inventory', error);
            throw error;
        } finally {
            setActionInProgress(false);
        }
    };

    const handleClose = (): void => {
        setDialogContent('');
        setIsDialogOpen(false);
    };

    const handleBack = (): void => {
        if (onClose) {
            onClose();
            return;
        }

        setIdToDisplay?.(null);
    };

    const handleImageClick: MouseEventHandler<HTMLImageElement> = (event) => {
        setOpenImageURL(event.currentTarget.src);
        setIsImageOpen(true);
    };

    const resetToInProcessing = async (): Promise<void> => {
        setActionInProgress(true);
        try {
            if (donationDetails) {
                await updateDonation(donationDetails.id, {
                    status: 'in processing'
                });
                await fetchDonation(donationDetails.id, {
                    showLoader: false,
                    notifyParent: true
                });
                setDialogContent(
                    `'${donationDetails.brand} - ${donationDetails.model}' has been returned to the approval queue.`
                );
                setIsDialogOpen(true);
            }
        } catch (error) {
            addErrorEvent('Error resetting donation to in processing', error);
            throw error;
        } finally {
            setActionInProgress(false);
        }
    };

    const deleteInventoryDonation = async (): Promise<void> => {
        if (!donationDetails) {
            return;
        }
        setActionInProgress(true);
        try {
            await deleteInventoryDonationById(donationDetails.id);
            onDonationDeleted?.(donationDetails.id);
            setDonationsUpdated?.(true);
            setIsDeleteDialogOpen(false);
            handleBack();
        } catch (error) {
            addErrorEvent('Error deleting inventory donation', error);
            throw error;
        } finally {
            setActionInProgress(false);
        }
    };

    const handleImageClose = () => setIsImageOpen(false);

    const generateProductLifeCycleReport = (donation: Donation) => {
        return productLifeCycleReport(donation);
    };

    useEffect(() => {
        if (!id) {
            return;
        }
        if (!donation || donationDetailsUpdated) {
            fetchDonation(id, {
                showLoader: !donationDetailsUpdated,
                notifyParent: donationDetailsUpdated
            });
        }
    }, [id, donation, donationDetailsUpdated, fetchDonation]);

    const isInventoryItem =
        donationDetails?.status === 'available' ||
        donationDetails?.status === 'unavailable';

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                {!isEditMode ? (
                    <h3>Donation Details</h3>
                ) : (
                    <h3>Edit Donation</h3>
                )}
                {(onClose || setIdToDisplay) && (
                    <IconButton onClick={handleBack}>
                        <ArrowBackIcon />
                    </IconButton>
                )}

                {isLoading && <Loader />}
                {!isLoading && donationDetails === null && (
                    <p>Donation not found</p>
                )}
                {!isLoading && donationDetails !== null && !isEditMode && (
                    <div className="content--container">
                        <ImageList>
                            {donationDetails.images.map((image) => (
                                <ImageListItem key={image as string}>
                                    <img
                                        src={`${image}`}
                                        alt={donationDetails.model}
                                        loading="lazy"
                                        onClick={handleImageClick}
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            sx={{ marginBottom: '1em' }}
                        >
                            <Button
                                variant="contained"
                                type="button"
                                startIcon={<EditIcon />}
                                disabled={actionInProgress}
                                onClick={() => setIsEditMode(true)}
                            >
                                Edit Donation
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                disabled={actionInProgress}
                                onClick={() =>
                                    generateProductLifeCycleReport(
                                        donationDetails
                                    )
                                }
                            >
                                Lifecycle Report
                            </Button>
                            {donationDetails.status === 'available' && (
                                <Button
                                    variant="contained"
                                    startIcon={<RemoveCircleOutlineIcon />}
                                    color="warning"
                                    disabled={actionInProgress}
                                    onClick={removeFromInventory}
                                >
                                    Remove from inventory
                                </Button>
                            )}

                            {donationDetails.status !== 'in processing' &&
                                donationDetails.status !== 'distributed' &&
                                donationDetails.status !== 'unavailable' && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<RestartAltIcon />}
                                        color="warning"
                                        disabled={actionInProgress}
                                        onClick={resetToInProcessing}
                                    >
                                        Return to Approval Queue
                                    </Button>
                                )}
                            {isInventoryItem && (
                                <Button
                                    variant="outlined"
                                    startIcon={<DeleteIcon />}
                                    color="error"
                                    disabled={actionInProgress}
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                >
                                    Delete
                                </Button>
                            )}
                        </Stack>

                        <Divider sx={{ marginBottom: '1em' }}></Divider>
                        <Typography variant="h5">
                            {donationDetails.brand} - {donationDetails.model}
                        </Typography>
                        {donationDetails.status !== 'rejected' && (
                            <Typography variant="h6">
                                {donationDetails.tagNumber ?? 'No tag number'}
                            </Typography>
                        )}
                        <Typography variant="body1">
                            <b>Status: </b>
                            {statusLabelByValue[donationDetails.status] ??
                                donationDetails.status}
                        </Typography>
                        {(donationDetails.status === 'available' ||
                            donationDetails.status === 'unavailable') && (
                            <Typography variant="body1">
                                <b>Days in storage: </b>
                                {donationDetails.getDaysInStorage()}
                            </Typography>
                        )}

                        <Typography
                            variant="body1"
                            sx={{ marginTop: '1em' }}
                        >
                            <b>Category: </b> {donationDetails.category}
                        </Typography>

                        <Typography variant="body1">
                            <b>Description: </b>
                            {donationDetails.description}
                        </Typography>
                        {donationDetails.dateAccepted && (
                            <Typography variant="body1">
                                <b>Accepted on: </b>
                                {donationDetails.dateAccepted
                                    .toDate()
                                    .toDateString()}
                            </Typography>
                        )}
                        {(donationDetails.donorEmail.length > 0 ||
                            donationDetails.donorName.length > 0) && (
                            <Typography variant="body1">
                                <b>Donated by: </b>
                                {donationDetails.donorName} (
                                {donationDetails.donorEmail})
                            </Typography>
                        )}

                        {donationDetails.dateReceived && (
                            <Typography variant="body1">
                                <b>Received on: </b>
                                {donationDetails.dateReceived
                                    .toDate()
                                    .toDateString()}
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
                                {donationDetails.dateRequested
                                    .toDate()
                                    .toDateString()}
                            </Typography>
                        )}
                        {donationDetails.distributor && (
                            <Typography variant="body1">
                                <b>Distributed by: </b>
                                {donationDetails.distributor.name} (
                                {donationDetails.distributor.email})
                            </Typography>
                        )}
                        {donationDetails.dateDistributed && (
                            <Typography variant="body1">
                                <b>Date distributed: </b>
                                {donationDetails.dateDistributed
                                    .toDate()
                                    .toDateString()}
                            </Typography>
                        )}
                        <Dialog
                            open={isImageOpen}
                            onClose={handleImageClose}
                            sx={{ width: '100%' }}
                        >
                            <img
                                src={openImageURL}
                                alt={openImageURL}
                                style={{ maxWidth: '100%' }}
                            />
                            <DialogActions>
                                <Button
                                    type="button"
                                    onClick={handleImageClose}
                                >
                                    Close
                                </Button>
                            </DialogActions>
                        </Dialog>
                        <CustomDialog
                            isOpen={isDialogOpen}
                            title="Donation updated"
                            content={dialogContent}
                            onClose={handleClose}
                        />
                        <Dialog
                            open={isDeleteDialogOpen}
                            onClose={() => setIsDeleteDialogOpen(false)}
                        >
                            <DialogTitle>Delete inventory item?</DialogTitle>
                            <DialogContent>
                                <DialogContentText>
                                    This permanently deletes{' '}
                                    {donationDetails.brand} -{' '}
                                    {donationDetails.model}. Only available or
                                    unavailable inventory items can be deleted.
                                </DialogContentText>
                            </DialogContent>
                            <DialogActions>
                                <Button
                                    type="button"
                                    onClick={() => setIsDeleteDialogOpen(false)}
                                    disabled={actionInProgress}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    color="error"
                                    variant="contained"
                                    onClick={deleteInventoryDonation}
                                    disabled={actionInProgress}
                                >
                                    Delete
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </div>
                )}
                {!isLoading && donationDetails && isEditMode && (
                    <EditDonation
                        donationDetails={donationDetails}
                        setIsEditMode={setIsEditMode}
                        setDonationDetailsUpdated={setDonationDetailsUpdated}
                        setDonationsUpdated={setDonationsUpdated}
                    />
                )}
            </div>
        </ProtectedAdminRoute>
    );
};

export default DonationDetails;
