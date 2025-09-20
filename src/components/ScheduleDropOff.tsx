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
import { Box, Button, FormControl, NativeSelect, TextField, InputLabel } from '@mui/material';
import DonationCardSmall from './DonationCardSmall';
import sendEmail from '@/api/sendgrid';
import sendMail from '@/api/nodemailer';
import accept from '@/email-templates/accept';
import reject from '@/email-templates/reject';

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

    let donorEmail = '';
    let donorName = '';
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

    const handleSubmit = async () => {
        //send email with renderToString(message) and update donation statuses
        const emailMsg = acceptedDonations && acceptedDonations.length > 0 ? accept(donorEmail, inviteUrl, notes) : reject(donorEmail, notes);
        try {
            await sendMail({
                from: 'bryan.parmelee@gmail.com',
                to: donorEmail,
                subject: 'Your Baby Equipment Exchange donation has been reviewed',
                html: renderToString(message)
            });
        } catch (error) {
            addErrorEvent('Error submitting accept/reject email', error);
        }
    };

    const fetchEvents = async () => {
        try {
            const eventResult = await getSchedulingPageLink();
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
                            <DonationCardSmall key={donation.id} donation={donation} />
                        ))}
                    </ul>
                </>
            )}
            {rejectedDonations && rejectedDonations.length > 0 && (
                <>
                    <p>The following items have been rejected:</p>
                    <ul>
                        {rejectedDonations.map((donation) => (
                            <DonationCardSmall key={donation.id} donation={donation} />
                        ))}
                    </ul>
                </>
            )}
        </>
    );

    useEffect(() => {
        fetchEvents();
    }, []);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <h3>Send Accept/Reject Email</h3>
            </div>
            <p>{`The following email will be sent to ${donorEmail}:`}</p>
            <div className="content--container">
                <Box display={'flex'} flexDirection={'column'}>
                    {message}
                    <TextField
                        type="text"
                        label="Additional notes"
                        name="notes"
                        id="notes"
                        value={notes}
                        multiline={true}
                        minRows={8}
                        maxRows={Infinity}
                        placeholder="Add any additional notes here"
                        onChange={handleInputChange}
                    ></TextField>
                    {acceptedDonations && acceptedDonations.length > 0 && (
                        <FormControl fullWidth sx={{ marginTop: '2em' }}>
                            <InputLabel variant="standard" htmlFor="location" shrink={true}>
                                Select calendar for accepted donations
                            </InputLabel>
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
                        </FormControl>
                    )}
                    <Box sx={{ marginTop: '2em' }} display={'flex'} gap={2}>
                        <Button onClick={handleSubmit} disabled={isDisabled} variant="contained">
                            Send scheduling Link
                        </Button>
                        <Button variant="outlined" type="button" onClick={() => setOpenScheduler(false)}>
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </div>
        </ProtectedAdminRoute>
    );
};

export default ScheduleDropOff;
