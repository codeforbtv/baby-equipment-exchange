import { Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Paper, Typography } from '@mui/material';
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

const PendingDonationsSection = ({ donations, setIdToDisplay, setNotificationsUpdated, activeStorageLocations }: Props) => {
    const router = useRouter();
    if (donations.length === 0) return null;

    return (
        <div className={styles['notification-section']}>
            <Typography sx={{ marginTop: '1rem', marginBottom: '0.5rem' }} variant="h6">
                Donations requiring approval
            </Typography>
            {donations.map((donationArray, i) => (
                <Paper className={styles['notification-card--container']} key={i} elevation={0}>
                    {donationArray.map((donation) => (
                        <NotificationCard
                            key={donation.id}
                            donation={donation}
                            type="pending-donation"
                            setIdToDisplay={setIdToDisplay}
                            setNotificationsUpdated={setNotificationsUpdated}
                            activeStorageLocations={activeStorageLocations}
                        />
                    ))}
                    <Button
                        className={styles['notification-card--container--btn']}
                        variant="contained"
                        onClick={() => router.push(`/accept/${donationArray[0].bulkCollection}`)}
                    >
                        Review
                    </Button>
                </Paper>
            ))}
        </div>
    );
};

export default PendingDonationsSection;
