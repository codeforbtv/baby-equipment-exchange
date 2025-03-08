'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useContext, useEffect, useState, ChangeEvent } from 'react';
import { UserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { getSchedulingPageLink } from '@/api/calendly';
import { getDonorEmailByDonationId } from '@/api/firebase-donations';

import { EventType } from '@/types/CalendlyTypes';

import '../../../styles/globalStyles.css';
import { Button } from '@mui/material';

export default function ScheduleDropoff({ params }: { params: { id: string } }) {
    const { isAdmin } = useContext(UserContext);
    const router = useRouter();

    if (!isAdmin) router.push('/');

    const [events, setEvents] = useState<EventType[]>([]);
    const [inviteUrl, setInviteUrl] = useState<string>('');
    const [donorEmail, setDonorEmail] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        setInviteUrl(event.target.value);
    };

    const handleSubmit = () => {
        setMessage(`You are sending the scheduling link ${inviteUrl} to ${donorEmail}`);
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

    return (
        <ProtectedRoute>
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
                <Button onClick={handleSubmit}>Send scheduling Link</Button>
                <div>{message.length > 0 && message}</div>
            </div>
        </ProtectedRoute>
    );
}
