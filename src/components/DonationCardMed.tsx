'use client';

//Hooks
//Components
import DonationDetails from './DonationDetails';
//Styles
import '@/styles/globalStyles.css';
const thumbnailStyles = {
    width: '15%',
    objectFit: 'cover',
    aspectRatio: '1 / 1'
};
//types
import { Donation } from '@/models/donation';
import { Dispatch, SetStateAction, useState } from 'react';
import { Card, CardActions, CardContent, CardMedia, Typography } from '@mui/material';
import ProtectedAdminRoute from './ProtectedAdminRoute';
type DonationCardMedProps = {
    donation: Donation;
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
};

const DonationCardMed = (props: DonationCardMedProps) => {
    const { donation, setIdToDisplay } = props;
    return (
        <ProtectedAdminRoute>
            <Card className="card--container">
                <CardActions onClick={() => setIdToDisplay(donation.id)}>
                    <CardMedia component="img" alt={donation.model} image={donation.images[0]} sx={thumbnailStyles} />
                    <CardContent>
                        <Typography variant="h3">{donation.model}</Typography>
                        <Typography variant="h4">{donation.brand}</Typography>
                        <Typography variant="h5">Description: {donation.description}</Typography>
                    </CardContent>
                </CardActions>
            </Card>
        </ProtectedAdminRoute>
    );
};

export default DonationCardMed;
