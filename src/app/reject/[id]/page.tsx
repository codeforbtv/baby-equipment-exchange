'use client';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import { useContext, useEffect, useState, ChangeEvent } from 'react';
import { UserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { getSchedulingPageLink } from '@/api/calendly';
import { getDonationById } from '@/api/firebase-donations';
import sendEmail from '@/api/sendgrid';
import reject from '@/email-templates/reject';
import { addErrorEvent } from '@/api/firebase';

import { email } from '@/types/SendgridTypes';

import '../../../styles/globalStyles.css';

import { Box, Button, TextField } from '@mui/material';

export default function RejectDonation({ params }: { params: { id: string } }) {
    const { isAdmin } = useContext(UserContext);
    const router = useRouter();

    //prevents useEffect from firing
    if (!isAdmin) {
        router.push('/');
        return null;
    }

    const [donorEmail, setDonorEmail] = useState<string>('');
    const [notes, sentNotes] = useState<string>('');

    const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => sentNotes(event.target.value);

    const handleReject = async () => {
        //TODO change donation status to 'rejected' or delete donation?
        const message: email = reject(donorEmail, notes);
        sendEmail(message).then(() => console.log(`email sent to ${donorEmail}`));
    };

    useEffect(() => {
        const fetchDonorEmail = async () => {
            try {
                const donation = await getDonationById(params.id);
                setDonorEmail(donation.donorEmail);
            } catch (error) {
                addErrorEvent('Fetch donor email', error);
            }
        };
        fetchDonorEmail();
    }, []);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <h1>Reject Donation</h1>
                <h4>Add additional notes as necessary:</h4>
            </div>
            <div className="content--container">
                <Box display={'flex'} flexDirection={'column'} gap={4}>
                    <TextField
                        type="text"
                        label="Notes"
                        name="notes"
                        id="notes"
                        value={notes}
                        multiline={true}
                        minRows={8}
                        maxRows={Infinity}
                        placeholder="Add notes here"
                        onChange={handleInputChange}
                    ></TextField>
                    <Button onClick={handleReject}>Reject Donation</Button>
                </Box>
            </div>
        </ProtectedAdminRoute>
    );
}
