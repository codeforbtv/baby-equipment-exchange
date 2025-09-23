'use client';

//Hooks
import { Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Card, CardActions, CardContent, CardMedia, Typography, Button } from '@mui/material';
//Api

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

type NotificationCardProps = {
    type: 'pending-donation' | 'order' | 'pending-user';
    donation?: Donation;
    authUser?: AuthUserRecord;
    order?: Order;
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

//TO-DO: Set up buttons
const NotificationCard = (props: NotificationCardProps) => {
    const { type, donation, authUser, order, setIdToDisplay } = props;

    const router = useRouter();

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
            {type === 'pending-user' && authUser && (
                <Card className={styles['card--container']} elevation={3}>
                    <CardActions onClick={() => setIdToDisplay(authUser.uid)} sx={{ width: '100%' }}>
                        <CardContent>
                            <Typography variant="h4">{authUser.displayName}</Typography>
                            <Typography variant="h4">{authUser.email}</Typography>
                        </CardContent>
                    </CardActions>
                    <CardActions>
                        <Button variant="contained" onClick={() => setIdToDisplay(authUser.uid)}>
                            Review
                        </Button>
                    </CardActions>
                </Card>
            )}
        </ProtectedAdminRoute>
    );
};

export default NotificationCard;
