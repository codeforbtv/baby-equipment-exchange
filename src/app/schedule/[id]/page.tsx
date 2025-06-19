'use client';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import { useContext, useEffect, useState, ChangeEvent } from 'react';
import { UserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { getSchedulingPageLink } from '@/api/calendly';
import { getDonationById } from '@/api/firebase-donations';
import sendEmail from '@/api/sendgrid';
import accept from '@/email-templates/accept';
import { addErrorEvent } from '@/api/firebase';

import { EventType } from '@/types/CalendlyTypes';
import { email } from '@/types/SendgridTypes';

import '../../../styles/globalStyles.css';

import { Box, Button, NativeSelect, TextField } from '@mui/material';

export default function ScheduleDropoff({ params }: { params: { id: string } }) {
    const { isAdmin } = useContext(UserContext);
    const router = useRouter();

    //prevents useEffect from firing
    if (!isAdmin) {
        router.push('/');
        return null;
    }

    const [events, setEvents] = useState<EventType[]>([]);
    const [inviteUrl, setInviteUrl] = useState<string>('');
    const [donorEmail, setDonorEmail] = useState<string>('');
    const [notes, sentNotes] = useState<string>('');

    const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        setInviteUrl(event.target.value);
    };

    const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => sentNotes(event.target.value);

    const handleSubmit = async () => {
        //TODO change donation status to 'pending delivery'
        const message: email = accept(donorEmail, inviteUrl, notes);
        sendEmail(message).then(() => console.log(`email sent to ${donorEmail}`));
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventResult = await getSchedulingPageLink();
                setEvents(eventResult);
            } catch (error) {
                addErrorEvent('Fetch Calendly Scheduling Links', error);
            }
        };
        const fetchDonorEmail = async () => {
            try {
                const donation = await getDonationById(params.id);
                setDonorEmail(donation.donorEmail);
            } catch (error) {
                addErrorEvent('Fetch donor email', error);
            }
        };
        fetchEvents();
        fetchDonorEmail();
    }, []);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <h1>Accept Donation</h1>
                <h4>Select a calendar to send a scheduling link</h4>
            </div>
            <div className="content--container">
                <Box display={'flex'} flexDirection={'column'} gap={4}>
                    <NativeSelect variant="outlined" name="location" id="location" onChange={handleSelect} value={inviteUrl}>
                        <option value="" disabled>
                            Select an Drop Off Location
                        </option>
                        {events.map((event, index) => {
                            if (event.active === true) {
                                return (
                                    <option key={index} value={event.scheduling_url}>
                                        {event.name}
                                    </option>
                                );
                            }
                        })}
                    </NativeSelect>
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
                    <Button onClick={handleSubmit} disabled={!inviteUrl}>
                        Send scheduling Link
                    </Button>
                </Box>
            </div>
        </ProtectedAdminRoute>
    );
}
