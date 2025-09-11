// Components
import { IconButton, ImageListItem, ImageListItemBar } from '@mui/material';
import Loader from './Loader';
// Hooks
import { Suspense, lazy, useState } from 'react';
import { useRouter } from 'next/navigation';
// Icons
import InfoIcon from '@mui/icons-material/Info';
// Styles
import styles from './Card.module.css';
// Types

import { Donation } from '@/models/donation';

const ExistingDonationDialog = lazy(() => import('./ExistingDonationDialog'));

type DonationCardProps = {
    donation: Donation;
};

export default function DonationCard(props: DonationCardProps) {
    const { donation } = props;

    const [showDialog, setShowDialog] = useState<boolean>(false);
    const image = donation.images ? donation.images[0] : '';

    const router = useRouter();

    const closeDialog = () => {
        setShowDialog(false);
    };

    const openDialog = () => {
        setShowDialog(true);
    };

    const deleteDonation = () => {
        closeDialog();
    };

    return (
        <ImageListItem key={donation.id} className={styles['grid__item']}>
            <img
                src={image}
                style={{ width: '100%', height: '100%', objectFit: 'fill' }}
                alt={`Brand ${donation.brand} and model ${donation.model} description ${donation.description}`}
            />
            <ImageListItemBar
                title={donation.brand}
                subtitle={donation.model}
                actionIcon={
                    <IconButton
                        sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                        aria-label={`details about ${donation.brand} ${donation.model}`}
                        onClick={() => router.push(`/donations/${donation.id}`)}
                    >
                        <InfoIcon />
                    </IconButton>
                }
            />
            <Suspense fallback={<Loader />}>
                <ExistingDonationDialog initialParameters={{ initAsOpen: showDialog, data: donation }} onClose={closeDialog} onDelete={deleteDonation} />
            </Suspense>
        </ImageListItem>
    );
}
