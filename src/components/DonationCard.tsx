'use client';

import { Card, CardMedia, CardContent, CardActionArea, Typography, Stack, Chip, IconButton, Divider, Box } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { getStatusChipProps } from '@/utils/statusChipProps';
import { daysInStorage, agingTier, formatStorageLabel, isFrozen, TIER_COLOR } from '@/utils/storageTime';
import { Donation } from '@/models/donation';

type DonationCardProps = {
    donation: Donation;
    onSelect: (donation: Donation) => void;
};

export default function DonationCard({ donation, onSelect }: DonationCardProps) {
    const image = donation.images?.[0] || '';
    const statusChip = getStatusChipProps(donation.status);
    const days = daysInStorage(donation);
    const tier = agingTier(days);
    const storageLabel = formatStorageLabel(days);
    const frozen = isFrozen(donation);

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
                    image={image}
                    alt={`${donation.brand} ${donation.model}`}
                    sx={{ aspectRatio: '4/3', objectFit: 'cover', bgcolor: '#f5f5f5' }}
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
                    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="space-between" sx={{ mt: 0.75 }}>
                        <Chip size="small" color={statusChip.color} label={statusChip.label} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }} />
                        <IconButton
                            component="span"
                            size="small"
                            aria-label={`details about ${donation.brand} ${donation.model}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(donation);
                            }}
                        >
                            <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                    <Divider sx={{ mt: 1, mb: 0.75 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ minWidth: 0 }}>
                            {donation.donorEmail}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0, opacity: frozen ? 0.5 : 1 }}>
                            <Box
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    bgcolor: tier ? TIER_COLOR[tier] : 'transparent'
                                }}
                            />
                            <Typography
                                variant="caption"
                                sx={{ flexShrink: 0, fontWeight: 600, color: frozen || !tier ? 'text.secondary' : TIER_COLOR[tier] }}
                            >
                                {storageLabel}
                            </Typography>
                        </Stack>
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
