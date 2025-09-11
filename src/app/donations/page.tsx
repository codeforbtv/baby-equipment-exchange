'use client';

//Components
import { ImageList } from '@mui/material';
import DonationCard from '@/components/DonationCard';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Browse.module.css';
//Types
import { Donation } from '@/models/donation';
import { useState } from 'react';
import DonationDetails from '@/components/DonationDetails';

type DonationsProps = {
    donations: Donation[];
};

const Donations = (props: DonationsProps) => {
    const { donations } = props;
    const [showDetails, setShowDetails] = useState<string | null>(null);

    return (
        <>
            {showDetails ? (
                <DonationDetails id={showDetails} />
            ) : (
                <>
                    <div className="page--header">
                        <h1>Donations</h1>
                    </div>
                    <ImageList className={styles['browse__grid']}>
                        {donations.map((donation) => (
                            <DonationCard key={donation.id} donation={donation} setShowDetails={setShowDetails} />
                        ))}
                    </ImageList>
                </>
            )}
        </>
    );
};

export default Donations;
