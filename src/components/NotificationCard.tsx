'use client';

//Hooks
import { Dispatch, SetStateAction, useState } from 'react';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Card, CardActions, CardContent, CardMedia, Typography, Button } from '@mui/material';
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
import { AuthUserRecord } from '@/types/UserTypes';
import { Order } from '@/types/OrdersTypes';
import { addErrorEvent } from '@/api/firebase';
import { IUser } from '@/models/user';

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
    const router = useRouter();

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
                <Card className={styles['card--container']} elevation={3}>
                    <CardActions onClick={() => setIdToDisplay(user.uid)} sx={{ width: '100%' }}>
                        <CardContent>
                            <Typography variant="h4">{user.displayName}</Typography>
                            <Typography variant="h4">{user.email}</Typography>
                        </CardContent>
                    </CardActions>
                    <CardActions>
                        <Button variant="contained" onClick={() => setIdToDisplay(user.uid)}>
                            Review
                        </Button>
                    </CardActions>
                </Card>
            )}
        </ProtectedAdminRoute>
    );
};

export default NotificationCard;
