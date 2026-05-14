'use client';

//Hooks
import { Dispatch, ReactNode, SetStateAction, useEffect, useRef, useState } from 'react';
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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Loader from './Loader';
import CustomDialog from './CustomDialog';
//Api
import { markDonationAsDistributed, updateDonation, updateDonationStatus } from '@/api/firebase-donations';
import { addErrorEvent, getAuthIdToken } from '@/api/firebase';
import { enableUser, deleteUser } from '@/app/actions/firebase';
import sendMail from '@/api/nodemailer';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/NotificationCard.module.css';
//Types
import { Donation } from '@/models/donation';
import { IUser } from '@/models/user';
import { BookingMatchConfidence } from '@/types/CalendlyTypes';

import rejectUser from '@/email-templates/rejectUser';
import userEnabled from '@/email-templates/userEnabled';

type NotificationCardProps = {
    type: 'pending-donation' | 'pending-delivery' | 'reserved' | 'order' | 'pending-user';
    donation?: Donation;
    user?: IUser;
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
    calendlyStatus?: BookingMatchConfidence;
    isHighlighted?: boolean;
};

const CalendlyStatusChip = ({ status }: { status?: BookingMatchConfidence }) => {
    if (!status) return null;

    const config: Record<BookingMatchConfidence, { icon: ReactNode; label: string; color: string; bg: string }> = {
        confirmed: { icon: <CheckCircleOutlineIcon sx={{ fontSize: 13 }} />, label: 'Booked', color: '#2e7d32', bg: '#e8f5e9' },
        'possible-match': { icon: <HelpOutlineIcon sx={{ fontSize: 13 }} />, label: 'Possible match', color: '#f57f17', bg: '#fff8e1' },
        unconfirmed: { icon: <ErrorOutlineIcon sx={{ fontSize: 13 }} />, label: 'No booking', color: '#c62828', bg: '#ffebee' }
    };
    const statusConfig = config[status];

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                px: '7px',
                py: '2px',
                borderRadius: '10px',
                fontSize: '0.675rem',
                fontWeight: 600,
                background: statusConfig.bg,
                color: statusConfig.color,
                ml: 1,
                verticalAlign: 'middle'
            }}
        >
            {statusConfig.icon} {statusConfig.label}
        </Box>
    );
};

const NotificationCard = (props: NotificationCardProps) => {
    const { type, donation, user, setIdToDisplay, setNotificationsUpdated, calendlyStatus, isHighlighted } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [dialogTitle, setDialogTitle] = useState<string>('');
    const [dialogContent, setDialogContent] = useState<string>('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const highlightedSx = isHighlighted ? { boxShadow: '0 0 0 2px #ffc107, 0 4px 16px rgba(255, 193, 7, 0.25)', transition: 'box-shadow 0.4s ease' } : undefined;

    useEffect(() => {
        if (isHighlighted && cardRef.current) {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            cardRef.current.scrollIntoView({
                block: 'start',
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        }
    }, [isHighlighted]);

    const handleClose = () => {
        setIsDialogOpen(false);
        setDialogTitle('');
        setDialogContent('');
        if (setNotificationsUpdated) setNotificationsUpdated(true);
    };

    const handleDeleteDialogClose = () => {
        setIsDeleteDialogOpen(false);
    };

    const markAsReceived = async (id: string) => {
        setIsLoading(true);
        try {
            await updateDonationStatus(id, 'available');
            if (setNotificationsUpdated) setNotificationsUpdated(true);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Mark donation as received', error);
            throw error;
        }
    };

    const markAsNotReceived = async (id: string) => {
        setIsLoading(true);
        try {
            await updateDonationStatus(id, 'not-received');
            if (setNotificationsUpdated) setNotificationsUpdated(true);
        } catch (error) {
            addErrorEvent('Mark donation as not received', error);
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
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Mark as distributed', error);
            throw error;
        }
    };

    const returnToInventory = async (id: string) => {
        setIsLoading(true);
        try {
            await updateDonation(id, {
                status: 'available'
            });
            if (setNotificationsUpdated) setNotificationsUpdated(true);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Return to inventory', error);
            throw error;
        }
    };

    const handleEnableUser = async (uid: string, userName: string, userEmail: string): Promise<void> => {
        setIsLoading(true);
        try {
            await enableUser({ idToken: await getAuthIdToken(), userId: uid });
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
            await deleteUser({ idToken: await getAuthIdToken(), userId: uid });
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
                <Card ref={cardRef} className={styles['notification-card']} variant="outlined" sx={highlightedSx}>
                    <div className={styles['notification-card--group']}>
                        <CardActions className={styles['notification-card--image']} onClick={() => setIdToDisplay(donation.id)}>
                            <CardMedia component="img" alt={donation.model} image={donation.images[0]} />
                        </CardActions>
                        <CardContent className={styles['notification-card--info']}>
                            <Typography variant="h5">
                                {donation.brand} - {donation.model}
                                <CalendlyStatusChip status={calendlyStatus} />
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
                        <Card ref={cardRef} className={styles['notification-card']} variant="outlined" sx={highlightedSx}>
                            <div className={styles['notification-card--group']}>
                                <CardActions className={styles['notification-card--image']} onClick={() => setIdToDisplay(donation.id)}>
                                    <CardMedia component="img" alt={donation.model} image={donation.images[0]} />
                                </CardActions>
                                <CardContent className={styles['notification-card--info']}>
                                    <Typography variant="h5">
                                        {donation.brand} - {donation.model}
                                        <CalendlyStatusChip status={calendlyStatus} />
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
                                <Button variant="contained" onClick={() => markAsReceived(donation.id)}>
                                    Add to inventory
                                </Button>
                                <Button variant="contained" color="error" onClick={() => markAsNotReceived(donation.id)}>
                                    Not Received
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
                        <Card ref={cardRef} className={styles['notification-card']} variant="outlined" sx={highlightedSx}>
                            <div className={styles['notification-card--group']}>
                                <CardActions className={styles['notification-card--image']} onClick={() => setIdToDisplay(donation.id)}>
                                    <CardMedia component="img" alt={donation.model} image={donation.images[0]} />
                                </CardActions>
                                <CardContent className={styles['notification-card--info']}>
                                    <Typography variant="h5">
                                        {donation.brand} - {donation.model}
                                        <CalendlyStatusChip status={calendlyStatus} />
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
                                <Button variant="contained" color="error" onClick={() => returnToInventory(donation.id)}>
                                    Return to Inventory
                                </Button>
                            </CardActions>
                        </Card>
                    )}
                </>
            )}
            {type === 'order' && donation && (
                <Card ref={cardRef} className={styles['notification-card']} variant="outlined" sx={highlightedSx}>
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
                            <Card ref={cardRef} className={styles['notification-card']} variant="outlined" sx={highlightedSx}>
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
                                    <DialogContentText id="dialog-description">This will delete the user &quot;{user.displayName}.&quot; Are you sure?</DialogContentText>
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
