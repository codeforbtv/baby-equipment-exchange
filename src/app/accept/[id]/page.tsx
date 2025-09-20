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
import DonationDetails from '@/components/DonationDetails';

const AcceptDonation = ({ params }: { params: { id: string } }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [donations, setDonations] = useState<Donation[] | null>(null);
    const [accepted, setAccepted] = useState<string[]>([]);
    const [rejected, setRejected] = useState<string[]>([]);
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);

    const fetchDonationsByBulkId = async (id: string): Promise<void> => {
        setIsLoading(true);
        try {
            const donationsResult = await getDonationsByBulkId(id);
            setDonations(donationsResult);
        } catch (error) {
            addErrorEvent('Fetch donations by bulk id', error);
        } finally {
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

    return (
        <ProtectedAdminRoute>
            {!isLoading && idToDisplay ? (
                <DonationDetails id={idToDisplay} setIdToDisplay={setIdToDisplay} />
            ) : (
                <div style={{ marginTop: '4em' }}>
                    <div className="page--header">
                        <h3>Review donation</h3>
                    </div>
                    {isLoading && !idToDisplay && <Loader />}
                    {!isLoading && !idToDisplay && !donations && <p>Donation collection not found.</p>}
                    {!isLoading && !idToDisplay && donations && (
                        <div>
                            {donations.map((donation) => (
                                <AcceptRejectCard
                                    key={donation.id}
                                    donation={donation}
                                    handleAcceptReject={handleAcceptReject}
                                    setIdToDisplay={setIdToDisplay}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </ProtectedAdminRoute>
    );
};

export default AcceptDonation;
