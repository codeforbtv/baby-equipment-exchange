import { Dispatch, SetStateAction } from 'react';
import { Paper, Typography } from '@mui/material';
import NotificationCard from '@/components/NotificationCard';
import styles from '@/components/NotificationCard.module.css';
import { Donation } from '@/models/donation';
import { NotificationCallbacks } from '@/types/NotificationTypes';

interface Props {
    donations: Donation[][];
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
    callbacks?: NotificationCallbacks;
}

const ReservedDonationsSection = ({ donations, setIdToDisplay, callbacks }: Props) => {
    if (donations.length === 0) return null;

    return (
        <div className={styles['notification-section']}>
            <Typography sx={{ marginTop: '1rem', marginBottom: '0.5rem' }} variant="h6">
                Donations waiting for pickup
            </Typography>
            {donations.map((donationArray, i) => (
                <Paper className={styles['notification-card--container']} key={i} elevation={0}>
                    <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
                        {`${donationArray[0].donorName} has reserved the following items for pickup:`}
                    </Typography>
                    {donationArray.map((donation) => (
                        <NotificationCard
                            key={donation.id}
                            donation={donation}
                            type="reserved"
                            setIdToDisplay={setIdToDisplay}
                            callbacks={callbacks}
                        />
                    ))}
                </Paper>
            ))}
        </div>
    );
};

export default ReservedDonationsSection;
