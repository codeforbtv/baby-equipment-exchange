'use client';

//Hoooks
import { useEffect, useState } from 'react';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Loader from '@/components/Loader';
//API
import { addErrorEvent } from '@/api/firebase';
import { getDonationsByBulkId } from '@/api/firebase-donations';
//Styles
import '@/styles/globalStyles.css';
//Types
import { Donation } from '@/models/donation';
import AcceptRejectCard from '@/components/AcceptRejectCard';

const AcceptDonation = ({ params }: { params: { id: string } }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [donations, setDonations] = useState<Donation[] | null>(null);
    const [accepted, setAccepted] = useState<string[]>([]);
    const [rejected, setRejected] = useState<string[]>([]);

    const fetchDonationsByBulkId = async (id: string): Promise<void> => {
        setIsLoading(true);
        try {
            const donationsResult = await getDonationsByBulkId(id);
            setDonations(donationsResult);
            setIsLoading(false);
        } catch (error) {
            addErrorEvent('Fetch donations by bulk id', error);
            setIsLoading(false);
        }
    };
    type ButtonStatus = 'accepted' | 'rejected' | null;

    const handleAcceptReject = (value: ButtonStatus, id: string): void => {
        if (value === 'accepted' && !accepted.includes(id)) {
            setAccepted([...accepted, id]);
            setRejected(rejected.filter((item) => item !== id));
        } else if (value === 'rejected' && !rejected.includes(id)) {
            setRejected([...rejected, id]);
            setAccepted(accepted.filter((item) => item !== id));
        } else if (!value) {
            //if deselected remove from both
            setAccepted(accepted.filter((item) => item !== id));
            setRejected(rejected.filter((item) => item !== id));
        }
    };

    useEffect(() => {
        fetchDonationsByBulkId(params.id);
    }, []);

    useEffect(() => {
        console.log(donations);
    }, [donations]);

    useEffect(() => {
        console.log('accepts: ', accepted, 'rejects: ', rejected);
    }, [accepted, rejected]);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <h3>Review donation</h3>
                {isLoading && <Loader />}
                {!isLoading && !donations && <p>Donation collection not found.</p>}
                {!isLoading && donations && (
                    <div className="content--container">
                        {donations.map((item) => (
                            <AcceptRejectCard donation={item} handleAcceptReject={handleAcceptReject} />
                        ))}
                    </div>
                )}
            </div>
        </ProtectedAdminRoute>
    );
};

export default AcceptDonation;
