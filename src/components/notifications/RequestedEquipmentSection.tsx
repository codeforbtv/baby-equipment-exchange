import { Dispatch, SetStateAction } from 'react';
import { Button, Paper, Typography } from '@mui/material';
import NotificationCard from '@/components/NotificationCard';
import styles from '@/components/NotificationCard.module.css';
import { Order } from '@/types/OrdersTypes';

interface Props {
    orders: Order[];
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
    setOrderIdToDisplay: Dispatch<SetStateAction<string | null>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
}

const RequestedEquipmentSection = ({ orders, setIdToDisplay, setOrderIdToDisplay, setNotificationsUpdated }: Props) => {
    if (orders.length === 0) return null;

    return (
        <div className={styles['notification-section']}>
            <Typography sx={{ marginTop: '1rem', marginBottom: '0.5rem' }} variant="h6">
                Requested Equipment
            </Typography>
            {orders.map((order) => (
                <Paper className={styles['notification-card--container']} key={order.id} elevation={0}>
                    <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
                        {`${order.requestor.name} has requested the following items:`}
                    </Typography>
                    {order.items.length > 0 ? (
                        order.items.map((item) => (
                            <NotificationCard
                                key={item.id}
                                type="order"
                                donation={item}
                                setIdToDisplay={setIdToDisplay}
                                setNotificationsUpdated={setNotificationsUpdated}
                            />
                        ))
                    ) : (
                        <Typography variant="body1" sx={{ marginBottom: '1rem' }}>
                            No items available. Please review.
                        </Typography>
                    )}
                    <Button className={styles['notification-card--container--btn']} variant="contained" onClick={() => setOrderIdToDisplay(order.id)}>
                        Review
                    </Button>
                </Paper>
            ))}
        </div>
    );
};

export default RequestedEquipmentSection;
