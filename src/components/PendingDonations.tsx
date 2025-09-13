'use client';

//Components
import ImageThumbnail from './ImageThumbnail';
import { Card, Button, Box, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

//Styles
import styles from './PendingDonations.module.css';

//Types
import { DonationFormData } from '@/types/DonationTypes';

type pendingDonationProps = {
    pendingDonations: DonationFormData[];
    removeHandler: (index: number) => void;
};

export default function PendingDonations(props: pendingDonationProps) {
    return (
        <Box>
            <Typography variant="h3">Items to be donated:</Typography>
            <Box className={styles['pendingDonation--container']}>
                {props.pendingDonations.map((donation, i) => {
                    if (donation.images)
                        return (
                            <Card key={i} elevation={5} className={styles['pendingDonation--card']}>
                                <ImageThumbnail file={donation.images[0]} width={'10%'} margin={'.66%'} />
                                <div className={styles['text--group']}>
                                    <Typography variant="h4" className={styles['left--column']}>
                                        {donation.model}
                                    </Typography>
                                    <Typography variant="h4" className={styles['right--column']}>
                                        {donation.brand}
                                    </Typography>
                                </div>
                                <Button variant="outlined" type="button" onClick={() => props.removeHandler(i)}>
                                    <DeleteIcon />
                                </Button>
                            </Card>
                        );
                })}
            </Box>
        </Box>
    );
}
