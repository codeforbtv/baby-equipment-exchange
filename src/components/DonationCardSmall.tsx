'use client';

// Components
import { Card, CardContent, CardMedia, Typography } from '@mui/material';
import ProtectedAdminRoute from './ProtectedAdminRoute';
// Styles
import '@/styles/globalStyles.css';

const thumbnailStyles = {
    width: '10%',
    objectFit: 'cover',
    aspectRatio: '1 / 1'
};
// Types
import { Donation } from '@/models/donation';

type DonationCardSmallProps = {
    donation: Donation;
};

export default function DonationCardSmall(props: DonationCardSmallProps) {
    const { donation } = props;
    const image = donation.images ? donation.images[0] : '';

    return (
        <Card className="card--container" elevation={3}>
            <CardMedia component="img" alt={donation.model} image={donation.images[0]} sx={thumbnailStyles} />
            <CardContent>
                <Typography variant="h4">{donation.model}</Typography>
                <Typography variant="h4">{donation.brand}</Typography>
            </CardContent>
        </Card>
    );
}
