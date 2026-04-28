import { Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Paper, Typography } from '@mui/material';
import NotificationCard from '@/components/NotificationCard';
import styles from '@/components/NotificationCard.module.css';
import { Donation } from '@/models/donation';

interface Props {
    donations: { key: string; donations: Donation[] }[];
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
}

const PendingDonationsSection = ({ donations, setIdToDisplay }: Props) => {
    const router = useRouter();
    if (donations.length === 0) return null;

    return (
        <div className={styles['notification-section']}>
            <Typography sx={{ marginTop: '1rem', marginBottom: '0.5rem' }} variant="h6">
                Donations requiring approval
            </Typography>
            {donations.map(({ key, donations }) => (
                <Paper key={key} className={styles['notification-card--container']} elevation={0}>
                    <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
                        {`${donations[0].donorName}'s items are waiting to be approved:`}
                    </Typography>
                    {donations.map((donation) => (
                        <NotificationCard key={donation.id} donation={donation} type="pending-donation" setIdToDisplay={setIdToDisplay} />
                    ))}
                    <Button className={styles['notification-card--container--btn']} variant="contained" onClick={() => router.push(`/accept/${key}`)}>
                        Review
                    </Button>
                </Paper>
            ))}
        </div>
    );
};

export default PendingDonationsSection;
