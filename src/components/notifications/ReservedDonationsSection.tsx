import { Dispatch, SetStateAction } from 'react';
import { Paper, Typography } from '@mui/material';
import NotificationCard from '@/components/NotificationCard';
import styles from '@/components/NotificationCard.module.css';
import { Donation } from '@/models/donation';
import { Storage } from '@/models/storage';

interface Props {
    donations: Donation[][];
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
    activeStorageLocations?: Storage[];
}

const ReservedDonationsSection = ({ donations, setIdToDisplay, setNotificationsUpdated, activeStorageLocations }: Props) => {
    if (donations.length === 0) return null;

    return (
        <div className={styles['notification-section']}>
            <Typography sx={{ marginTop: '1rem', marginBottom: '0.5rem' }} variant="h6">
                Donations waiting for pickup
            </Typography>
            {donations.map((donationArray, i) => (
                <Paper className={styles['notification-card--container']} key={i} elevation={0}>
                    {donationArray.map((donation) => (
                        <NotificationCard
                            key={donation.id}
                            donation={donation}
                            type="reserved"
                            setIdToDisplay={setIdToDisplay}
                            setNotificationsUpdated={setNotificationsUpdated}
                            activeStorageLocations={activeStorageLocations}
                        />
                    ))}
                </Paper>
            ))}
        </div>
    );
};

export default ReservedDonationsSection;
