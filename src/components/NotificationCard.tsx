'use client';

//Hooks
import { Dispatch, SetStateAction, useState } from 'react';
import { useRouter } from 'next/navigation';
//Components
import Link from 'next/link';
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
    DialogActions,
    Box
} from '@mui/material';
import Loader from './Loader';
import CustomDialog from './CustomDialog';
//Api
import { markDonationAsDistributed, updateDonationStatus } from '@/api/firebase-donations';
import { addErrorEvent, callDeleteUser, callEnableUser } from '@/api/firebase';
import { deleteDbUser, enableDbUser } from '@/api/firebase-users';
import sendMail from '@/api/nodemailer';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/NotificationCard.module.css';
//Types
import { Donation } from '@/models/donation';
import { Order } from '@/types/OrdersTypes';
import { IUser } from '@/models/user';

import rejectUser from '@/email-templates/rejectUser';
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
        if (setNotificationsUpdated) setNotificationsUpdated(true);
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
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const markAsDistributed = async (donation: Donation) => {
        setIsLoading(true);
        try {
            await markDonationAsDistributed(donation);
            if (setNotificationsUpdated) setNotificationsUpdated(true);
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
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProtectedAdminRoute>
            {type === 'pending-donation' && donation && (
                <Card className={styles['notification-card']} raised>
                    <div className={styles['notification-card--group']}>
                        <CardActions className={styles['notification-card--image']} onClick={() => setIdToDisplay(donation.id)}>
                            <CardMedia component="img" alt={donation.model} image={donation.images[0]} />
                        </CardActions>
                        <CardContent className={styles['notification-card--info']}>
                            <Typography variant="h5">
                                {donation.brand} - {donation.model}
                            </Typography>
                            <Typography variant="h6">{donation.tagNumber}</Typography>
                            <Typography variant="caption">Donated by:</Typography>
                            <Typography variant="subtitle1">
                                {donation.donorName} ({donation.donorEmail})
                            </Typography>
                        </CardContent>
                    </div>
                </Card>
            )}
            {type === 'pending-delivery' && donation && (
                <>
                    {isLoading ? (
                        <Loader />
                    ) : (
                        <Card className={styles['notification-card']} raised>
                            <div className={styles['notification-card--group']}>
                                <CardActions className={styles['notification-card--image']} onClick={() => setIdToDisplay(donation.id)}>
                                    <CardMedia component="img" alt={donation.model} image={donation.images[0]} />
                                </CardActions>
                                <CardContent className={styles['notification-card--info']}>
                                    <Typography variant="h5">
                                        {donation.brand} - {donation.model}
                                    </Typography>
                                    <Typography variant="h6">{donation.tagNumber}</Typography>
                                    {donation.dateAccepted && (
                                        <>
                                            <Typography variant="caption">Accepted on:</Typography>
                                            <Typography variant="body1"> {donation.dateAccepted.toDate().toDateString()}</Typography>
                                        </>
                                    )}
                                    <Typography variant="caption">Donated by:</Typography>
                                    <Typography variant="subtitle1">
                                        {donation.donorName} ({donation.donorEmail})
                                    </Typography>
                                </CardContent>
                            </div>
                            <CardActions className={styles['notification-card--container--btn']}>
                                <Button variant="contained" onClick={() => markAsRecieved(donation.id)}>
                                    Add to inventory
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
                        <Card className={styles['notification-card']} raised>
                            <div className={styles['notification-card--group']}>
                                <CardActions className={styles['notification-card--image']} onClick={() => setIdToDisplay(donation.id)}>
                                    <CardMedia component="img" alt={donation.model} image={donation.images[0]} />
                                </CardActions>
                                <CardContent className={styles['notification-card--info']}>
                                    <Typography variant="h5">
                                        {donation.brand} - {donation.model}
                                    </Typography>
                                    <Typography variant="h6">{donation.tagNumber}</Typography>
                                    {donation.dateRequested && (
                                        <>
                                            <Typography variant="caption">Requested on:</Typography>
                                            <Typography variant="body1">{donation.dateRequested.toDate().toDateString()}</Typography>
                                        </>
                                    )}
                                    <Typography variant="caption">Requested by:</Typography>
                                    <Typography variant="subtitle1">
                                        <Link href={`/users/${donation.requestor?.id}`}>
                                            {donation.requestor?.name} ({donation.requestor?.email})
                                        </Link>
                                    </Typography>
                                </CardContent>
                            </div>
                            <CardActions className={styles['notification-card--container--btn']}>
                                <Button variant="contained" onClick={() => markAsDistributed(donation)}>
                                    Mark as distributed
                                </Button>
                            </CardActions>
                        </Card>
                    )}
                </>
            )}
            {type === 'order' && donation && (
                <Card className={styles['notification-card']} raised>
                    <div className={styles['notification-card--group']}>
                        <CardActions className={styles['notification-card--image']} onClick={() => setIdToDisplay(donation.id)}>
                            <CardMedia component="img" alt={donation.model} image={donation.images[0]} />
                        </CardActions>
                        <CardContent className={styles['notification-card--info']}>
                            <Typography variant="h5">
                                {donation.brand} - {donation.model}
                            </Typography>
                            <Typography variant="h6">{donation.tagNumber}</Typography>
                            <Typography variant="caption">Donated by:</Typography>
                            <Typography variant="subtitle1">
                                {donation.donorName} ({donation.donorEmail})
                            </Typography>
                        </CardContent>
                    </div>
                </Card>
            )}
            {type === 'pending-user' && user && (
                <>
                    {isLoading ? (
                        <Loader />
                    ) : (
                        <>
                            <Card className={styles['notification-card']} raised>
                                <CardActions onClick={() => setIdToDisplay(user.uid)} sx={{ width: '100%' }}>
                                    <CardContent className={styles['notification-card--info']}>
                                        <Typography variant="h5">{user.displayName}</Typography>
                                        <Typography variant="body1">({user.email})</Typography>
                                        {user.organization ? (
                                            <Typography variant="body1">
                                                <em>{user.organization.name}</em>
                                            </Typography>
                                        ) : (
                                            <Typography variant="body1" sx={{ color: 'red' }}>
                                                <em>No organization assigned.</em>
                                            </Typography>
                                        )}
                                    </CardContent>
                                </CardActions>
                                <CardActions className={styles['notification-card--container--btn']}>
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
