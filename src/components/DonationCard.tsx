'use client';

import { Card, CardMedia, CardContent, CardActionArea, Typography, Stack, Chip } from '@mui/material';
import { getStatusChipProps } from '@/utils/statusChipProps';
import { Donation } from '@/models/donation';

type DonationCardProps = {
    donation: Donation;
    onSelect: (donation: Donation) => void;
};

export default function DonationCard({ donation, onSelect }: DonationCardProps) {
    const image = donation.images?.length > 0 ? donation.images[0] : '';
    const statusChip = getStatusChipProps(donation.status);
    const daysInStorage = donation.getDaysInStorage?.();

    return (
        <Card
            sx={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                transition: 'box-shadow 0.2s, transform 0.2s',
                '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)'
                }
            }}
        >
            <CardActionArea onClick={() => onSelect(donation)}>
                <CardMedia
                    component="img"
                    image={image || '/placeholder.png'}
                    alt={`${donation.brand} ${donation.model}`}
                    sx={{ aspectRatio: '4/3', objectFit: 'cover' }}
                />
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                        {donation.brand} {donation.model}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                        {donation.tagNumber && (
                            <Chip size="small" label={donation.tagNumber} sx={{ height: 20, fontSize: '0.7rem' }} />
                        )}
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {donation.category}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75 }}>
                        <Chip size="small" label={statusChip.label} sx={{ ...statusChip.sx, height: 22, fontSize: '0.7rem', fontWeight: 600 }} />
                    </Stack>
                    {(daysInStorage !== undefined || donation.donorName) && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }} noWrap>
                            {daysInStorage !== undefined && `${daysInStorage}d in storage`}
                            {daysInStorage !== undefined && donation.donorName && ' · '}
                            {donation.donorName && donation.donorName}
                        </Typography>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
