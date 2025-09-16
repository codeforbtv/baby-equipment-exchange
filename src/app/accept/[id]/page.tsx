'use client';

import { addErrorEvent } from '@/api/firebase';
import { getDonationsByBulkId } from '@/api/firebase-donations';
import { Donation } from '@/models/donation';
import { useEffect, useState } from 'react';

const AcceptDonation = ({ params }: { params: { id: string } }) => {
    const [donations, setDonations] = useState<Donation[] | null>(null);

    const fetchDonationsByBulkId = async (id: string) => {
        try {
            const donationsResult = await getDonationsByBulkId(id);
            setDonations(donationsResult);
        } catch (error) {
            addErrorEvent('Fetch donations by bulk id', error);
        }
    };

    useEffect(() => {
        fetchDonationsByBulkId(params.id);
    }, []);

    useEffect(() => {
        console.log(donations);
    }, [donations]);

    return <div>page</div>;
};

export default AcceptDonation;
