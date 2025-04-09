'use client';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import { useContext, useEffect, useState, ChangeEvent } from 'react';
import { UserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { getSchedulingPageLink } from '@/api/calendly';
import { getDonorEmailByDonationId } from '@/api/firebase-donations';
import sendEmail from '@/api/sendgrid';

import { EventType } from '@/types/CalendlyTypes';
import { email } from '@/types/SendgridTypes';

import '../../../styles/globalStyles.css';
import { Button } from '@mui/material';

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
    const [message, setMessage] = useState<email>();

    const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        setInviteUrl(event.target.value);
    };

    //TO-DO: submit should send an email with the schedulig link to the donor.
    const handleSubmit = async () => {
        if (message) {
            sendEmail(message).then(() => console.log(`email sent to ${donorEmail}`));
        }
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventResult = await getSchedulingPageLink();
                setEvents(eventResult);
            } catch (error) {
                console.log(error);
            }
        };
        const fetchDonorEmail = async () => {
            try {
                const userEmail = await getDonorEmailByDonationId(params.id);
                setDonorEmail(userEmail);
            } catch (error) {
                console.log(error);
            }
        };
        fetchEvents();
        fetchDonorEmail();
    }, []);

    useEffect(() => {
        setMessage({
            to: donorEmail,
            from: 'info@vermontconnector.org',
            subject: 'Your donation(s) have been accpeted.',
            text: `Your donation(s) to the Baby Equipment Exchange have been accepted! Click this link to schedule a dropoff time: ${inviteUrl}`
        });
    }, [inviteUrl, donorEmail]);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <h1>Accept Donation</h1>
                <h4>Select a calendar to send a scheduling link</h4>
            </div>
            <div className="content--container">
                <select value={inviteUrl} onChange={handleSelect}>
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
                </select>
                <Button onClick={handleSubmit} disabled={!inviteUrl}>
                    Send scheduling Link
                </Button>
            </div>
        </ProtectedAdminRoute>
    );
}
