'use client';

//Hooks
import { useState, ChangeEvent, useEffect, Dispatch, SetStateAction } from 'react';
import { renderToString } from 'react-dom/server';
//Styles
import '@/styles/globalStyles.css';
//types
import { EventType } from '@/types/CalendlyTypes';
import { Donation } from '@/models/donation';
import { getSchedulingPageLink } from '@/api/calendly';
import { addErrorEvent } from '@/api/firebase';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Box, Button, NativeSelect, TextField } from '@mui/material';

type ScheduleDropOffProps = {
    acceptedDonations?: Donation[];
    rejectedDonations?: Donation[];
    setOpenScheduler: Dispatch<SetStateAction<boolean>>;
};

const ScheduleDropOff = (props: ScheduleDropOffProps) => {
    const { acceptedDonations, rejectedDonations, setOpenScheduler } = props;
    const [events, setEvents] = useState<EventType[] | null>(null);
    const [inviteUrl, setInviteUrl] = useState<string>('');
    const [notes, sentNotes] = useState<string>('');

    const isDisabled = acceptedDonations && acceptedDonations.length > 0 ? !inviteUrl : false;

    let donorEmail, donorName;
    if (acceptedDonations && acceptedDonations.length > 0) {
        donorEmail = acceptedDonations[0].donorEmail;
        donorName = acceptedDonations[0].donorName;
    } else if (rejectedDonations && rejectedDonations.length > 0) {
        donorEmail = rejectedDonations[0].donorEmail;
        donorName = rejectedDonations[0].donorName;
    }

    const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        setInviteUrl(event.target.value);
    };

    const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => sentNotes(event.target.value);

    const handleSubmit = () => {};

    const fetchEvents = async () => {
        try {
            const eventResult = await getSchedulingPageLink();
            console.log('result ', eventResult);
            setEvents(eventResult);
        } catch (error) {
            addErrorEvent('Fetch Calendly Scheduling Links', error);
        }
    };
    const message = (
        <>
            <p>{`Hello ${donorName},`}</p>
            <p>Thank you for submitting your donation to the Baby Equipment Exchange.</p>
            {acceptedDonations && acceptedDonations.length > 0 && (
                <>
                    <p>The following items have been accepted:</p>
                    <ul>
                        {acceptedDonations.map((donation) => (
                            <li key={donation.id}>
                                {donation.brand} {donation.model}
                            </li>
                        ))}
                    </ul>
                </>
            )}
            {rejectedDonations && rejectedDonations.length > 0 && (
                <>
                    <p>The following items have been rejected:</p>
                    <ul>
                        {rejectedDonations.map((donation) => (
                            <li key={donation.id}>
                                {donation.brand} {donation.model}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </>
    );

    useEffect(() => {
        fetchEvents();
    }, []);

    console.log(renderToString(message));

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <h3>Send Accept/Reject Email</h3>
            </div>
            <div className="content--container">
                <Box display={'flex'} flexDirection={'column'}>
                    <p>{`The following email will be sent to ${donorEmail}`}</p>
                    {acceptedDonations && acceptedDonations.length > 0 && (
                        <NativeSelect variant="outlined" name="location" id="location" onChange={handleSelect} value={inviteUrl}>
                            <option value="" disabled>
                                Select Calendar
                            </option>
                            {events &&
                                events.map((event, index) => {
                                    if (event.active === true) {
                                        return (
                                            <option key={index} value={event.scheduling_url}>
                                                {event.name}
                                            </option>
                                        );
                                    }
                                })}
                        </NativeSelect>
                    )}

                    {message}
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
                    <Button onClick={handleSubmit} disabled={isDisabled} variant="contained">
                        Send scheduling Link
                    </Button>
                    <Button variant="outlined" type="button" onClick={() => setOpenScheduler(false)}>
                        Cancel
                    </Button>
                </Box>
            </div>
        </ProtectedAdminRoute>
    );
};

export default ScheduleDropOff;
