'use client';

// Hooks
import { Dispatch, SetStateAction } from 'react';
// Components
import { Box, IconButton, ImageListItem, ImageListItemBar } from '@mui/material';
import Loader from './Loader';
// Icons
import InfoIcon from '@mui/icons-material/Info';
// Styles
import styles from './Card.module.css';
// Types
import { Donation, donationStatuses, DonationStatusKeys, DonationStatusValues } from '@/models/donation';

type DonationCardProps = {
    donation: Donation;
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
};

export default function DonationCard(props: DonationCardProps) {
    const { donation, setIdToDisplay } = props;
    const image = donation.images ? donation.images[0] : '';

    const statusSelectOptions = Object.keys(donationStatuses);

    return (
        <ImageListItem key={donation.id} className={styles['grid__item']}>
            <img
                src={image}
                style={{ minWidth: '100%', height: '100%', objectFit: 'cover' }}
                alt={`Brand ${donation.brand} and model ${donation.model} description ${donation.description}`}
                onClick={() => setIdToDisplay(donation.id)}
            />
            <ImageListItemBar
                title={`${donation.brand} - ${donation.tagNumber ?? 'No Tag Number'}`}
                subtitle={`Status: ${statusSelectOptions.find((key) => donationStatuses[key as DonationStatusKeys] === donation.status)}`}
                actionIcon={
                    <IconButton
                        sx={{ color: 'white' }}
                        aria-label={`details about ${donation.brand} ${donation.model}`}
                        onClick={() => setIdToDisplay(donation.id)}
                    >
                        <InfoIcon />
                    </IconButton>
                }
            />
        </ImageListItem>
    );
}
