'use client';

//Hooks
import { Dispatch, SetStateAction, useState } from 'react';
import { useRouter } from 'next/navigation';
//Components
import DonationCardSmall from './DonationCardSmall';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import CustomDialog from './CustomDialog';
//Api
import { addErrorEvent } from '@/api/firebase';
import { closeOrder, updateDonationStatus } from '@/api/firebase-donations';
//styles
import '@/styles/globalStyles.css';
//types
import { Order } from '@/types/OrdersTypes';
import Loader from './Loader';

type FinalizeReviewProps = {
    order: Order;
    shouldShow: Dispatch<SetStateAction<boolean>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const FinalizeReview = (props: FinalizeReviewProps) => {
    const { order, shouldShow, setNotificationsUpdated } = props;
    const { requestor, id, items, rejectedItems } = order;
    const router = useRouter();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [showAlert, setShowAlert] = useState<boolean>(false);

    const handleClose = () => {
        setIsDialogOpen(false);
        router.push('/');
        window.location.reload();
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            await Promise.all(
                order.items.map(async (item) => {
                    await updateDonationStatus(item.id, 'reserved');
                })
            );
            await closeOrder(id);
            setShowAlert(false);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error submitting review without scheduling', error);
        } finally {
            setIsLoading(false);
        }
    };

    const review = (
        <>
            {items.length > 0 && (
                <>
                    <p>{items.length === 1 ? 'The following item has been fulfilled:' : 'The following items have been fulfilled:'}</p>
                    {items.map((item) => (
                        <DonationCardSmall key={item.id} donation={item} />
                    ))}
                </>
            )}
            {rejectedItems && rejectedItems.length > 0 && (
                <>
                    <p>{rejectedItems.length === 1 ? 'The following item is not available:' : 'The following items are not available:'}</p>
                    {rejectedItems?.map((item) => (
                        <DonationCardSmall key={item.id} donation={item} />
                    ))}
                </>
            )}
        </>
    );

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <h3>Finalize Review</h3>
            </div>
            {isLoading ? (
                <Loader />
            ) : (
                <>
                    <p>{`Summary of review for ${requestor.name} (${requestor.email})`}</p>
                    <div className="content--container">
                        <Box display={'flex'} flexDirection={'column'}>
                            {review}
                            <Box sx={{ marginTop: '2em' }} display={'flex'} gap={2}>
                                <Button variant="contained" onClick={() => setShowAlert(true)}>
                                    Complete Review
                                </Button>
                                <Button variant="outlined" onClick={() => shouldShow(false)}>
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    </div>
                </>
            )}
            <CustomDialog isOpen={isDialogOpen} onClose={handleClose} title="Review complete" content={'Your review has been processed successfully!'} />
            {/* confirm submit without scheduling dialog */}
            <Dialog open={showAlert} aria-labelledby="no-schedule-dialog-title" aria-describedby="no-schedule-dialog-description">
                <DialogTitle id="no-schedule-dialog-title">Finalize review without scheduling?</DialogTitle>
                <DialogContent>
                    <DialogContentText id="no-schedule-dialog-description">
                        Are you sure you want to submit this review without sending a scheduling link?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={() => handleSubmit()}>
                        Confirm
                    </Button>
                    <Button variant="contained" onClick={() => setShowAlert(false)}>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </ProtectedAdminRoute>
    );
};

export default FinalizeReview;
