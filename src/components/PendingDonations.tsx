'use client';

//Components
import ImageThumbnail from './ImageThumbnail';
import { Card, Button, Box, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

//Styles
import styles from './PendingDonations.module.css';

//Types
import { DonationFormData } from '@/types/DonationTypes';
import { usePendingDonationsContext } from '@/contexts/PendingDonationsContext';

export default function PendingDonations() {
    const { pendingDonations, removePendingDonation, pendingDonorEmail, pendingDonorName, setPendingDonorEmail, setPendingDonorName } =
        usePendingDonationsContext();

    const handleEditName = () => {
        setPendingDonorEmail('');
        setPendingDonorName('');
        localStorage.removeItem('donorEmail');
        localStorage.removeItem('donorName');
    };

    return (
        <Box className={styles['pendingDonation--container']}>
            {pendingDonations.map((donation, i) => {
                if (donation.images)
                    return (
                        <Card key={i} elevation={5} className={styles['pendingDonation--card']}>
                            <ImageThumbnail file={donation.images[0]} width={'10%'} margin={'.66%'} />
                            <div className={styles['text--group']}>
                                <Typography variant="h5" className={styles['left--column']}>
                                    {donation.model}
                                </Typography>
                                <Typography variant="h6" className={styles['right--column']}>
                                    {donation.brand}
                                </Typography>
                            </div>

                            <Button variant="outlined" type="button" onClick={() => removePendingDonation(i)}>
                                <DeleteIcon />
                            </Button>
                        </Card>
                    );
            })}
        </Box>
    );
}
