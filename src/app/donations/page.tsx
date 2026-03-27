'use client';

//Hooks
import { useState, useEffect } from 'react';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Loader from '@/components/Loader';
import Donations from '@/components/Donations';
//Api
import { getAllDonations } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Browse.module.css';
//Types
import { Donation } from '@/models/donation';

const DonationsPage = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [donations, setDonations] = useState<Donation[] | null>(null);

    async function fetchDonations(): Promise<void> {
        setIsLoading(true);
        try {
            const donationsResult = await getAllDonations();
            setDonations(donationsResult);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Error fetching all donations', error);
        }
    }

    useEffect(() => {
        fetchDonations();
    }, []);

    return (
        <ProtectedAdminRoute>
            <>
                {isLoading && <Loader />}
                {!isLoading && !donations && <p>No donations found</p>}
                {!isLoading && donations && <Donations donations={donations} />}
            </>
        </ProtectedAdminRoute>
    );
};

export default DonationsPage;
