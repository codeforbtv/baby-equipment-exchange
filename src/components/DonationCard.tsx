// Components
import { IconButton, ImageListItem, ImageListItemBar } from '@mui/material';
import Loader from './Loader';
// Hooks
import { Suspense, lazy, useState } from 'react';
// Icons
import InfoIcon from '@mui/icons-material/Info';
// Styles
import styles from './Card.module.css';
// Types
import { DonationCardProps } from '@/types/DonationCardProps';

const ExistingDonationDialog = lazy(() => import('./ExistingDonationDialog'));

export default function DonationCard({ active, category, brand, description, images, model, id }: DonationCardProps) {
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const image = images[0];

    const closeDialog = () => {
        setShowDialog(false);
    };

    const openDialog = () => {
        setShowDialog(true);
    };

    return (
        <ImageListItem key={image} className={styles['grid__item']}>
            <img
                src={image}
                style={{ width: '100%', height: '100%', objectFit: 'fill' }}
                alt={`Brand ${brand} and model ${model} description ${description}`}
            />
            <ImageListItemBar
                title={brand}
                subtitle={model}
                actionIcon={
                    <IconButton sx={{ color: 'rgba(255, 255, 255, 0.54)' }} aria-label={`details about ${brand} ${model}`} onClick={openDialog}>
                        <InfoIcon />
                    </IconButton>
                }
            />
            <Suspense fallback={<Loader />}>
                <ExistingDonationDialog
                    initialParameters={{ initAsOpen: showDialog, data: { active, category, brand, description, model, images, id } }}
                    controllers={{ closeController: closeDialog }}
                />
            </Suspense>
        </ImageListItem>
    );
}
