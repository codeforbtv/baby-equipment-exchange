'use client';

//Components
import { ImageList } from '@mui/material';
//Styles
import '../styles/globalStyles.css';
import styles from './Browse.module.css';
//Types

import { Donation, donationStatuses } from '@/models/donation';
import DonationCard from '@/components/DonationCard';

const Donations = (props: Donation[]) => {
    return (
        <>
            <div className="page--header">
                <h1>Donations</h1>
            </div>
            <ImageList className={styles['browse__grid']}>
                {props.map((donation) => (
                    <DonationCard key={donation.id} donation={donation} />
                ))}
            </ImageList>
        </>
    );
};

export default Donations;
