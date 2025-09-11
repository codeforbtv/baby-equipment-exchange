'use client';

//Components
import { ImageList } from '@mui/material';
import DonationCard from '@/components/DonationCard';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Browse.module.css';
//Types
import { Donation } from '@/models/donation';

type DonationsProps = {
    donations: Donation[];
};

const Donations = (props: DonationsProps) => {
    const { donations } = props;
    return (
        <>
            <div className="page--header">
                <h1>Donations</h1>
            </div>
            <ImageList className={styles['browse__grid']}>
                {donations.map((donation) => (
                    <DonationCard key={donation.id} donation={donation} />
                ))}
            </ImageList>
        </>
    );
};

export default Donations;
