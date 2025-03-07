'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useContext, useEffect, useState, ChangeEvent } from 'react';
import { UserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { getSchedulingPageLink } from '@/api/calendly';

import { EventType } from '@/types/CalendlyTypes';

import '../../../styles/globalStyles.css';

export default function ScheduleDropoff({ params }: { params: { id: string } }) {
    const { isAdmin } = useContext(UserContext);
    const router = useRouter();

    if (!isAdmin) router.push('/');

    const [events, setEvents] = useState<EventType[]>([]);
    const [inviteUrl, setInviteUrl] = useState<string>('');

    const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        setInviteUrl(event.target.value);
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
        fetchEvents();
    }, []);

    return (
        <ProtectedRoute>
            <div className="page--header">
                <h1>Send Scheduling Link</h1>
                <h4>[Page Summary]</h4>
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
            </div>
        </ProtectedRoute>
    );
}
