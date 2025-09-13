// Components
import { IconButton, ImageListItem, ImageListItemBar } from '@mui/material';
import Loader from './Loader';
// Hooks
import { Suspense, lazy, useState, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
// Icons
import InfoIcon from '@mui/icons-material/Info';
// Styles
import styles from './Card.module.css';
// Types

import { Donation } from '@/models/donation';
import Link from 'next/link';

const ExistingDonationDialog = lazy(() => import('./ExistingDonationDialog'));

type DonationCardProps = {
    donation: Donation;
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
};

export default function DonationCard(props: DonationCardProps) {
    const { donation, setIdToDisplay } = props;
    const image = donation.images ? donation.images[0] : '';

    return (
        <ImageListItem key={donation.id} className={styles['grid__item']}>
            <img
                src={image}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt={`Brand ${donation.brand} and model ${donation.model} description ${donation.description}`}
                onClick={() => setIdToDisplay(donation.id)}
            />
            <ImageListItemBar
                title={donation.brand}
                subtitle={donation.model}
                actionIcon={
                    <IconButton
                        sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
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
