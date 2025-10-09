'use client';

//Hooks
import { Dispatch, SetStateAction, useState } from 'react';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import {
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import Loader from './Loader';
//Api
import { updateDonationStatus } from '@/api/firebase-donations';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/NotificationCard.module.css';
const thumbnailStyles = {
    width: '15%',
    objectFit: 'cover',
    aspectRatio: '1 / 1'
};
//Types
import { Donation } from '@/models/donation';
import type { DialogProps } from '@mui/material';
import { Order } from '@/types/OrdersTypes';
import { addErrorEvent, callDeleteUser, callEnableUser } from '@/api/firebase';
import { IUser } from '@/models/user';
import CustomDialog from './CustomDialog';
import { deleteDbUser, enableDbUser } from '@/api/firebase-users';
import rejectUser from '@/email-templates/rejectUser';
import sendMail from '@/api/nodemailer';
import userEnabled from '@/email-templates/userEnabled';

type NotificationCardProps = {
    type: 'pending-donation' | 'pending-delivery' | 'reserved' | 'order' | 'pending-user';
    donation?: Donation;
    user?: IUser;
    order?: Order;
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

//TO-DO: Set up buttons
const NotificationCard = (props: NotificationCardProps) => {
    const { type, donation, user, order, setIdToDisplay, setNotificationsUpdated } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [dialogTitle, setDialogTitle] = useState<string>('');
    const [dialogContent, setDialogContent] = useState<string>('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

    const router = useRouter();

    const handleClose = () => {
        setIsDialogOpen(false);
        setDialogTitle('');
        setDialogContent('');
    };

    const handleDeleteDialogClose = () => {
        setIsDeleteDialogOpen(false);
    };

    const markAsRecieved = async (id: string) => {
        setIsLoading(true);
        try {
            await updateDonationStatus(id, 'available');
            if (setNotificationsUpdated) setNotificationsUpdated(true);
            window.location.reload();
        } catch (error) {
            addErrorEvent('Mark donation as recieved', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsDistributed = async (id: string) => {
        setIsLoading(true);
        try {
            await updateDonationStatus(id, 'distributed');
            if (setNotificationsUpdated) setNotificationsUpdated(true);
            true;
            window.location.reload();
        } catch (error) {
            addErrorEvent('Mark as distributed', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnableUser = async (uid: string, userName: string, userEmail: string): Promise<void> => {
        setIsLoading(true);
        try {
            await Promise.all([callEnableUser(uid), enableDbUser(uid)]);
            const msg = userEnabled(userEmail, userName);
            await sendMail(msg);
            setDialogTitle('User enabled');
            setDialogContent(`The user ${userName} has been enabled.`);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Call enable user', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (uid: string, userName: string, userEmail: string): Promise<void> => {
        setIsLoading(true);
        try {
            await Promise.all([callDeleteUser(uid), deleteDbUser(uid)]);
            const msg = rejectUser(userEmail, userName);
            await sendMail(msg);
            setIsDeleteDialogOpen(false);
            setDialogTitle('User deleted');
            setDialogContent(`The user ${userName} has been deleted.`);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Call delete user', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProtectedAdminRoute>
            {type === 'pending-donation' && donation && (
                <Card className={styles['card--container']} elevation={3}>
                    <CardActions onClick={() => setIdToDisplay(donation.id)}>
                        <CardMedia component="img" alt={donation.model} image={donation.images[0]} sx={thumbnailStyles} />
                        <CardContent>
                            <Typography variant="h4">{donation.model}</Typography>
                            <Typography variant="h4">{donation.brand}</Typography>
                        </CardContent>
                    </CardActions>
                    <CardActions>
                        <Button variant="contained" onClick={() => router.push(`/accept/${donation.bulkCollection}`)}>
                            Review
                        </Button>
                    </CardActions>
                </Card>
            )}
            {type === 'pending-delivery' && donation && (
                <>
                    {isLoading ? (
                        <Loader />
                    ) : (
                        <Card className={styles['card--container']} elevation={3}>
                            <CardActions onClick={() => setIdToDisplay(donation.id)}>
                                <CardMedia component="img" alt={donation.model} image={donation.images[0]} sx={thumbnailStyles} />
                                <CardContent>
                                    <Typography variant="h4">{donation.model}</Typography>
                                    <Typography variant="h4">{donation.brand}</Typography>
                                </CardContent>
                            </CardActions>
                            <CardActions>
                                <Button variant="contained" onClick={() => markAsRecieved(donation.id)}>
                                    Mark as available
                                </Button>
                            </CardActions>
                        </Card>
                    )}
                </>
            )}
            {type === 'reserved' && donation && (
                <>
                    {isLoading ? (
                        <Loader />
                    ) : (
                        <Card className={styles['card--container']} elevation={3}>
                            <CardActions onClick={() => setIdToDisplay(donation.id)}>
                                <CardMedia component="img" alt={donation.model} image={donation.images[0]} sx={thumbnailStyles} />
                                <CardContent>
                                    <Typography variant="h4">{donation.model}</Typography>
                                    <Typography variant="h4">{donation.brand}</Typography>
                                </CardContent>
                            </CardActions>
                            <CardActions>
                                <Button variant="contained" onClick={() => markAsDistributed(donation.id)}>
                                    Mark as distributed
                                </Button>
                            </CardActions>
                        </Card>
                    )}
                </>
            )}
            {type === 'order' && order && (
                <Card className={styles['card--container']} elevation={3}>
                    <CardActions onClick={() => setIdToDisplay(order.id)}>
                        <CardContent>
                            <Typography variant="h4">{`${order.requestor.name} (${order.requestor.email}) has requested ${order.items.length} items.`}</Typography>
                        </CardContent>
                    </CardActions>
                    <CardActions>
                        <Button variant="contained" onClick={() => setIdToDisplay(order.id)}>
                            Review
                        </Button>
                    </CardActions>
                </Card>
            )}
            {type === 'pending-user' && user && (
                <>
                    {isLoading ? (
                        <Loader />
                    ) : (
                        <>
                            <Card className={styles['card--container']} elevation={3}>
                                <CardActions onClick={() => setIdToDisplay(user.uid)} sx={{ width: '100%' }}>
                                    <CardContent>
                                        <p>
                                            <b>{user.displayName}</b> ({user.email})
                                        </p>
                                        {user.organization ? (
                                            <p>
                                                <em>{user.organization.name}</em>
                                            </p>
                                        ) : (
                                            <p style={{ color: 'red' }}>
                                                <em>No organization assigned.</em>
                                            </p>
                                        )}
                                    </CardContent>
                                </CardActions>
                                <CardActions>
                                    <Button
                                        variant="contained"
                                        onClick={() => handleEnableUser(user.uid, user.displayName, user.email)}
                                        disabled={!user.organization}
                                    >
                                        Approve
                                    </Button>
                                    <Button variant="contained" color="error" onClick={() => setIsDeleteDialogOpen(true)}>
                                        Reject
                                    </Button>
                                </CardActions>
                            </Card>
                            {/* Dialog for rejecting user */}
                            <Dialog open={isDeleteDialogOpen} aria-labelledby="dialog-title" aria-describedby="dialog-description">
                                <DialogTitle id="dialog-title">Reject pending user?</DialogTitle>
                                <DialogContent>
                                    <DialogContentText id="dialog-description">This will delete the user "{user.displayName}." Are you sure?</DialogContentText>
                                    <DialogActions>
                                        <Button variant="contained" onClick={() => handleDeleteUser(user.uid, user.displayName, user.email)}>
                                            Confirm
                                        </Button>
                                        <Button variant="outlined" onClick={handleDeleteDialogClose}>
                                            Cancel
                                        </Button>
                                    </DialogActions>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </>
            )}
            {/* Confirmation dialog */}
            <CustomDialog isOpen={isDialogOpen} onClose={handleClose} title={dialogTitle} content={dialogContent} />
        </ProtectedAdminRoute>
    );
};

export default NotificationCard;
