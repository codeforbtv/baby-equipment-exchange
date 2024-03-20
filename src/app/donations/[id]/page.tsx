'use client';
import { getDonationById } from '@/api/firebase-donations';
import Loader from '@/components/Loader';
import { DonationDetail } from '@/models/donation-detail';
import { useEffect, useState } from 'react';

import { addEvent } from '@/api/firebase';

export default function DonationDetails({ params }: { params: { id: string } }) {
    const [donation, setDonation] = useState<DonationDetail | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    async function fetchDonationDetails(id: string) {
        try {
            const donationDetails = await getDonationById(id);
            setDonation(donationDetails);
            console.log(donationDetails);
            setIsLoading(false);
        } catch (error: any) {
            const keys: any[] = [];
            for (const key in error) {
                keys.push(key);
            }
            addEvent({ location: `donations/${id}`, keys: keys });
        }
    }

    useEffect(() => {
        fetchDonationDetails(params.id);
    }, []);

    return isLoading || donation == null ? (
        <Loader />
    ) : (
        <>
            <h3>Donation Details</h3>
            <p>
                {donation?.brand} {donation?.model}
            </p>
        </>
    );
}
