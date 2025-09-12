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
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';

type DonationsProps = {
    donations: Donation[];
};

const Donations = (props: DonationsProps) => {
    const { donations } = props;
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);

    return (
        <ProtectedAdminRoute>
            {idToDisplay ? (
                <DonationDetails id={idToDisplay} setIdToDisplay={setIdToDisplay} />
            ) : (
                <>
                    <div className="page--header">
                        <h1>Donations</h1>
                    </div>
                    <ImageList className={styles['browse__grid']}>
                        {donations.map((donation) => (
                            <DonationCard key={donation.id} donation={donation} setIdToDisplay={setIdToDisplay} />
                        ))}
                    </ImageList>
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default Donations;
