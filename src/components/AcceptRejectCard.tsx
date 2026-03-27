'use client';

import { Card, CardActions, CardMedia, CardContent, Typography, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Donation } from '@/models/donation';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import '@/styles/globalStyles.css';

const thumbnailStyles = {
    width: '15%',
    objectFit: 'cover',
    aspectRatio: '1 / 1'
};

type AcceptRejectCardProps = {
    donation: Donation;
    handleAcceptReject: (value: ButtonStatus, id: string) => void;
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
};

type ButtonStatus = 'accepted' | 'rejected' | null;

const AcceptRejectCard = (props: AcceptRejectCardProps) => {
    const { donation, handleAcceptReject, setIdToDisplay } = props;
    const [status, setStatus] = useState<ButtonStatus>(null);

    const handleToggle = (event: React.MouseEvent<HTMLElement>, value: ButtonStatus) => {
        setStatus(value);
    };

    useEffect(() => {
        handleAcceptReject(status, donation.id);
    }, [status]);

    return (
        <ProtectedAdminRoute>
            <Card className="card--container" elevation={3}>
                <CardActions onClick={() => setIdToDisplay(donation.id)} sx={{ cursor: 'pointer' }}>
                    <CardMedia component="img" alt={donation.model} image={donation.images[0]} sx={thumbnailStyles} />
                    <CardContent>
                        <Typography variant="h4">{donation.model}</Typography>
                        <Typography variant="h4">{donation.brand}</Typography>
                    </CardContent>
                </CardActions>
                <CardActions>
                    <ToggleButtonGroup value={status} exclusive onChange={handleToggle}>
                        <ToggleButton value="accepted" aria-label="accept button" color="success">
                            Accept
                        </ToggleButton>
                        <ToggleButton value="rejected" aria-label="reject button" color="error">
                            Reject
                        </ToggleButton>
                    </ToggleButtonGroup>
                </CardActions>
            </Card>
        </ProtectedAdminRoute>
    );
};

export default AcceptRejectCard;
