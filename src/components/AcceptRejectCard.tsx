'use client';

import { Box, Card, CardActions, CardContent, Typography, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import Image from 'next/image';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Donation } from '@/models/donation';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import '@/styles/globalStyles.css';

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
                    <Box sx={{ position: 'relative', width: '15%', aspectRatio: '1 / 1', flexShrink: 0 }}>
                        {donation.images?.[0] && (
                            <Image src={donation.images[0]} alt={donation.model} fill sizes="15vw" style={{ objectFit: 'cover' }} />
                        )}
                    </Box>
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
