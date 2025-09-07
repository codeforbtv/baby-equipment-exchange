'use client';

//Hooks
import { useEffect, useState } from 'react';
//APi
import { addErrorEvent } from '@/api/firebase';
import { getDonationById } from '@/api/firebase-donations';
//Components
import Loader from '@/components/Loader';
//Styles

//Types
import { Donation } from '@/models/donation';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';

export default function DonationDetails({ params }: { params: { id: string } }) {
    const [donationDetails, setDonationDetails] = useState<Donation | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);

    async function fetchDonation(id: string) {
        try {
            const donationToView = await getDonationById(id);
            setDonationDetails(donationToView);
            setIsLoading(false);
        } catch (error: any) {
            addErrorEvent(`Fetch donation by ID`, error);
            setIsLoading(false);
        }
    }
    useEffect(() => {
        fetchDonation(params.id);
    }, []);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                {isEditMode ? <h1>Donation Details</h1> : <h1>Edit Donation</h1>}
                {isLoading && <Loader />}
                {!isLoading && donationDetails === null && <p>Donation not found</p>}
                {!isLoading && donationDetails !== null && !isEditMode && (
                    <div className="content--container">
                        <h2>{donationDetails.brand}</h2>
                        <h3>{donationDetails.model}</h3>
                        <p>{donationDetails.description}</p>
                    </div>
                )}
            </div>
        </ProtectedAdminRoute>
    );
}
