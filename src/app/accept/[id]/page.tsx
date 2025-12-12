'use client';

//Hoooks
import { useEffect, useState } from 'react';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Loader from '@/components/Loader';
import { Button, Dialog, DialogActions, DialogContent } from '@mui/material';
import AcceptRejectCard from '@/components/AcceptRejectCard';
import DonationDetails from '@/components/DonationDetails';
import ScheduleDropOff from '@/components/ScheduleDropOff';
//API
import { addErrorEvent } from '@/api/firebase';
import { getDonationsByBulkId } from '@/api/firebase-donations';
//Styles
import '@/styles/globalStyles.css';
//types
import { Donation } from '@/models/donation';

const AcceptDonation = ({ params }: { params: { id: string } }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [donations, setDonations] = useState<Donation[] | null>(null);
    const [accepted, setAccepted] = useState<string[]>([]);
    const [rejected, setRejected] = useState<string[]>([]);
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);
    const [openSecheduler, setOpenScheduler] = useState<boolean>(false);

    //disable btton unless all donations are accepted or rejected
    const isDisabled = donations ? accepted.length + rejected.length !== donations.length : false;

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
