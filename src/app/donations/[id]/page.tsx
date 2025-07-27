'use client';
import { getDonationById } from '@/api/firebase-donations';
import Loader from '@/components/Loader';
import { useEffect, useState } from 'react';

import { addErrorEvent } from '@/api/firebase';
import { Donation } from '@/models/donation';

export default function DonationDetails({ params }: { params: { id: string } }) {
    const [donation, setDonation] = useState<Donation | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    async function fetchDonation(id: string) {
        try {
            const donationToView = await getDonationById(id);
            setDonation(donationToView);
            setIsLoading(false);
        } catch (error: any) {
            addErrorEvent(`Fetch donation by ID`, error);
            setIsLoading(false);
        }
    }
    useEffect(() => {
        fetchDonation(params.id);
    }, []);

    if (isLoading) {
        return <Loader />;
    }
    if (!isLoading && donation === null) {
        return <p>You are not authorized to view this donation.</p>;
    }
    if (!isLoading && donation !== null) {
        return (
            <div className="page--header">
                <h1>Donation Details</h1>
                <div className="content--container">
                    <h2>{donation.brand}</h2>
                    <h3>{donation.model}</h3>
                    <p>{donation.description}</p>
                </div>
            </div>
        );
    }
}
