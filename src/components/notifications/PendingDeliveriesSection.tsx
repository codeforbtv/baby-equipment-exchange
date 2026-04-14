import { Dispatch, SetStateAction } from 'react';
import { Paper, Typography } from '@mui/material';
import NotificationCard from '@/components/NotificationCard';
import styles from '@/components/NotificationCard.module.css';
import { Donation } from '@/models/donation';

interface Props {
    donations: Donation[][];
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
}

const PendingDeliveriesSection = ({ donations, setIdToDisplay, setNotificationsUpdated }: Props) => {
    if (donations.length === 0) return null;

    return (
        <div className={styles['notification-section']}>
            <Typography sx={{ marginTop: '1rem', marginBottom: '0.5rem' }} variant="h6">
                Donations waiting to be received
            </Typography>
            {donations.map((donationArray, i) => (
                <Paper className={styles['notification-card--container']} key={i} elevation={0}>
                    <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
                        {`${donationArray[0].donorName}'s items are waiting to be received:`}
                    </Typography>
                    {donationArray.map((donation) => (
                        <NotificationCard
                            key={donation.id}
                            donation={donation}
                            type="pending-delivery"
                            setIdToDisplay={setIdToDisplay}
                            setNotificationsUpdated={setNotificationsUpdated}
                        />
                    ))}
                </Paper>
            ))}
        </div>
    );
};

export default PendingDeliveriesSection;
