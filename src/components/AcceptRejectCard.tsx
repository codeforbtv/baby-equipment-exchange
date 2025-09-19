'use client';

import { Card, CardActions, CardMedia, CardContent, Typography, ButtonGroup, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Donation } from '@/models/donation';
import { useEffect, useState } from 'react';
import { validateTestPhoneNumbers } from 'firebase-admin/lib/auth/auth-config';

const thumbnailStyles = {
    width: '15%',
    objectFit: 'cover',
    aspectRatio: '1 / 1'
};

type AcceptRejectCardProps = {
    donation: Donation;
    handleAcceptReject: (value: ButtonStatus, id: string) => void;
};

type ButtonStatus = 'accepted' | 'rejected' | null;

const AcceptRejectCard = (props: AcceptRejectCardProps) => {
    const { donation, handleAcceptReject } = props;
    const [status, setStatus] = useState<ButtonStatus>(null);

    const handleToggle = (event: React.MouseEvent<HTMLElement>, value: ButtonStatus) => {
        setStatus(value);
    };

    useEffect(() => {
        handleAcceptReject(status, donation.id);
    }, [status]);

    return (
        <ProtectedAdminRoute>
            <Card>
                <CardActions>
                    <CardMedia component="img" alt={donation.model} image={donation.images[0]} sx={thumbnailStyles} />
                    <CardContent>
                        <Typography variant="h4">{donation.model}</Typography>
                        <Typography variant="h4">{donation.brand}</Typography>
                    </CardContent>
                </CardActions>
                <CardActions>
                    <ToggleButtonGroup value={status} exclusive onChange={handleToggle}>
                        <ToggleButton value="accepted" aria-label="accept button">
                            Accept
                        </ToggleButton>
                        <ToggleButton value="rejected" aria-label="reject button">
                            Reject
                        </ToggleButton>
                    </ToggleButtonGroup>
                </CardActions>
            </Card>
        </ProtectedAdminRoute>
    );
};

export default AcceptRejectCard;
