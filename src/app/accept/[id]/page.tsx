'use client';

//Hoooks
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Loader from '@/components/Loader';
import { Button, Dialog, DialogActions, DialogContent, IconButton } from '@mui/material';
import AcceptRejectCard from '@/components/AcceptRejectCard';
import DonationDetails from '@/components/DonationDetails';
import ScheduleDropOff from '@/components/ScheduleDropOff';
//Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//API
import { addErrorEvent } from '@/api/firebase';
import { getDonationsByBulkId } from '@/api/firebase-donations';
import { getAllCategories } from '@/api/firebase-categories';
import posthog from 'posthog-js';
//Styles
import '@/styles/globalStyles.css';
//types
import { Donation } from '@/models/donation';
import { Category } from '@/models/category';

const AcceptDonation = ({ params }: { params: { id: string } }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [donations, setDonations] = useState<Donation[] | null>(null);
    const router = useRouter();
    const [accepted, setAccepted] = useState<string[]>([]);
    const [rejected, setRejected] = useState<string[]>([]);
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);
    const [openSecheduler, setOpenScheduler] = useState<boolean>(false);
    const [categories, setCategories] = useState<Category[]>([]);

    //disable btton unless all donations are accepted or rejected
    const isDisabled = donations ? accepted.length + rejected.length !== donations.length : false;

    type ButtonStatus = 'accepted' | 'rejected' | null;

    const handleAcceptReject = (value: ButtonStatus, id: string): void => {
        if (value === 'accepted' && !accepted.includes(id)) {
            setAccepted([...accepted, id]);
            setRejected(rejected.filter((item) => item !== id));
            posthog.capture('donation_reviewed', { decision: 'accepted', donation_id: id });
        } else if (value === 'rejected' && !rejected.includes(id)) {
            setRejected([...rejected, id]);
            setAccepted(accepted.filter((item) => item !== id));
            posthog.capture('donation_reviewed', { decision: 'rejected', donation_id: id });
        } else if (!value) {
            //if deselected remove from both
            setAccepted(accepted.filter((item) => item !== id));
            setRejected(rejected.filter((item) => item !== id));
        }
    };

    const handleCategoryFixed = (donationId: string, newCategory: string) => {
        setDonations((prev) => prev && prev.map((d) => (d.id === donationId ? Object.assign(Object.create(Object.getPrototypeOf(d)), d, { category: newCategory }) : d)));
    };

    useEffect(() => {
        const fetchDonationsByBulkId = async (id: string): Promise<void> => {
            setIsLoading(true);
            try {
                const donationsResult = await getDonationsByBulkId(id);
                const pendingDonations = donationsResult.filter((d) => d.status === 'in processing');

                if (pendingDonations.length === 0) {
                    alert('All items in this donation have already been processed.');
                    router.push('/');
                    return;
                }
                setDonations(pendingDonations);
            } catch (error) {
                addErrorEvent('Fetch donations by bulk id', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDonationsByBulkId(params.id);
        getAllCategories()
            .then(setCategories)
            .catch((err) => addErrorEvent('Fetch categories', err));
    }, [params.id, router]);

    return (
        <ProtectedAdminRoute>
            <div style={{ marginTop: '4em' }}>
                {openSecheduler ? (
                    <ScheduleDropOff
                        acceptedDonations={donations?.filter((d) => accepted.includes(d.id))}
                        rejectedDonations={donations?.filter((d) => rejected.includes(d.id))}
                        setOpenScheduler={setOpenScheduler}
                    />
                ) : (
                    <>
                        <div className="page--header">
                            <IconButton onClick={() => router.push('/')}>
                                <ArrowBackIcon />
                            </IconButton>
                            <h3>Review donation</h3>
                        </div>
                        {isLoading && !idToDisplay && <Loader />}
                        {!isLoading && !idToDisplay && !donations && <p>Donation collection not found.</p>}
                        {!isLoading && donations && (
                            <div>
                                <Dialog open={idToDisplay !== null} onClose={() => setIdToDisplay(null)} fullWidth maxWidth="xl">
                                    <DialogContent>
                                        <DonationDetails
                                            id={idToDisplay}
                                            donation={donations.find((donation) => donation.id === idToDisplay)}
                                            setIdToDisplay={setIdToDisplay}
                                        />
                                    </DialogContent>
                                    <DialogActions>
                                        <Button variant="contained" onClick={() => setIdToDisplay(null)}>
                                            Close
                                        </Button>
                                    </DialogActions>
                                </Dialog>
                                {donations.length > 1 && <p>Several items are included in this donation.</p>}
                                {donations.map((donation) => (
                                    <AcceptRejectCard
                                        key={donation.id}
                                        donation={donation}
                                        handleAcceptReject={handleAcceptReject}
                                        setIdToDisplay={setIdToDisplay}
                                        categories={categories}
                                        onCategoryFixed={handleCategoryFixed}
                                    />
                                ))}
                                <Button type="button" variant="contained" disabled={isDisabled} onClick={() => setOpenScheduler(true)}>
                                    {accepted.length === 0 ? 'Send Rejection Email' : ' Send Scheduling Link'}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </ProtectedAdminRoute>
    );
};

export default AcceptDonation;
