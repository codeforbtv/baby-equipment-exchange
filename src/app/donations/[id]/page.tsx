'use client';
import { getDonationById } from '@/api/firebase-donations';
import Loader from '@/components/Loader';
import { DonationDetailNoRefs } from '@/models/donation-detail';
import { useEffect, useState } from 'react';

import { addErrorEvent } from '@/api/firebase';

export default function DonationDetails({ params }: { params: { id: string } }) {
    // const [donationDetails, setDonationDetails] = useState<DonationDetailNoRefs | null>(null);
    // const [isLoading, setIsLoading] = useState<boolean>(true);
    // async function fetchDonationDetails(id: string) {
    //     try {
    //         const donationDetails = await getDonationById(id);
    //         setDonationDetails(donationDetails);
    //         setIsLoading(false);
    //     } catch (error: any) {
    //         addErrorEvent(`donations/${id}`, error);
    //         setIsLoading(false);
    //     }
    // }
    // useEffect(() => {
    //     fetchDonationDetails(params.id);
    // }, []);
    // if (isLoading) {
    //     return <Loader />;
    // }
    // if (!isLoading && donationDetails === null) {
    //     return <p>You are not authorized to view this donation.</p>;
    // }
    // if (!isLoading && donationDetails !== null) {
    //     const donation = donationDetails.donation;
    //     return (
    //         <div className="page--header">
    //             <h1>Donation Details</h1>
    //             <div className="content--container">
    //                 <h2>{donation.brand}</h2>
    //                 <h3>{donation.model}</h3>
    //             </div>
    //         </div>
    //     );
    // }
}
