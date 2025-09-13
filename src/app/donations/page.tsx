'use client';

//Components
import { Button, ImageList } from '@mui/material';
import DonationCard from '@/components/DonationCard';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Browse.module.css';
//Types
import { Donation } from '@/models/donation';
import { MouseEventHandler, useState } from 'react';
import DonationDetails from '@/components/DonationDetails';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import DonationForm from '@/components/DonationForm';
import CreateAdminDonation from '@/components/CreateAdminDonation';

type DonationsProps = {
    donations: Donation[];
};

const Donations = (props: DonationsProps) => {
    const { donations } = props;
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);

    const handleShowForm = () => {
        //Close details if open
        setIdToDisplay(null);
        setShowForm(true);
    };

    return (
        <ProtectedAdminRoute>
            {idToDisplay && <DonationDetails id={idToDisplay} setIdToDisplay={setIdToDisplay} />}
            {showForm && <CreateAdminDonation setShowForm={setShowForm} />}
            {!idToDisplay && !showForm && (
                <>
                    <div className="page--header">
                        <h1>Donations</h1>
                    </div>
                    <Button variant="contained" type="button" onClick={handleShowForm}>
                        Add donation
                    </Button>
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
