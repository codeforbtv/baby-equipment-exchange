'use client';

//Hooks
import { useState, ChangeEvent, useEffect, Dispatch, SetStateAction } from 'react';
import { renderToString } from 'react-dom/server';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Box, Button, FormControl, NativeSelect, TextField, InputLabel, IconButton } from '@mui/material';
import DonationCardSmall from './DonationCardSmall';
import Loader from './Loader';
import CustomDialog from './CustomDialog';
//Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//Api
import { getSchedulingPageLink } from '@/api/calendly';
import { addErrorEvent } from '@/api/firebase';
import sendMail from '@/api/nodemailer';
import posthog from 'posthog-js';
import accept from '@/email-templates/accept';
import reject from '@/email-templates/reject';
import { updateDropOffDonationStatuses } from '@/api/firebase-donations';
//Styles
import '@/styles/globalStyles.css';
//types
import { EventType } from '@/types/CalendlyTypes';
import { Donation } from '@/models/donation';

type ScheduleDropOffProps = {
    acceptedDonations?: Donation[];
    rejectedDonations?: Donation[];
    setOpenScheduler: Dispatch<SetStateAction<boolean>>;
};

const ScheduleDropOff = (props: ScheduleDropOffProps) => {
    const { acceptedDonations, rejectedDonations, setOpenScheduler } = props;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [events, setEvents] = useState<EventType[] | null>(null);
    const [inviteUrl, setInviteUrl] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const router = useRouter();

    let donorEmail = '';
    let donorName = '';
    if (acceptedDonations && acceptedDonations.length > 0) {
        donorEmail = acceptedDonations[0].donorEmail;
        donorName = acceptedDonations[0].donorName;
    } else if (rejectedDonations && rejectedDonations.length > 0) {
        donorEmail = rejectedDonations[0].donorEmail;
        donorName = rejectedDonations[0].donorName;
    }

    const handleClose = () => {
        setIsDialogOpen(false);
        router.push('/');
    };

    const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        setInviteUrl(event.target.value);
    };

    const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value);

    const message = (
        <>
            <p>{`Hello ${donorName},`}</p>
            <p>Thank you for submitting your donation to the Baby Product Exchange.</p>
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
                    <p>Unfortunately, the following items could not be accepted:</p>
                    <ul>
                        {rejectedDonations.map((donation) => (
                            <DonationCardSmall key={donation.id} donation={donation} />
                        ))}
                    </ul>
                </>
            )}
        </>
    );

    const handleSubmit = async () => {
        //send email with renderToString(message) and update donation statuses. If donation is accepted, assign a tagNumber
        setIsLoading(true);
        try {
            const acceptedDonationUpdates = await updateDropOffDonationStatuses({
                acceptedDonations:
                    acceptedDonations?.map((donation) => ({
                        id: donation.id,
                        category: donation.category
                    })) ?? [],
                rejectedDonationIds: rejectedDonations?.map((donation) => donation.id) ?? [],
                schedulingLink: inviteUrl || undefined
            });
            const tagNumbers = acceptedDonationUpdates.map((donation) => donation.tagNumber);
            const emailMsg =
                acceptedDonations && acceptedDonations.length > 0
                    ? accept(donorEmail, inviteUrl, renderToString(message), tagNumbers, notes)
                    : reject(donorEmail, renderToString(message), notes);
            await sendMail(emailMsg);
            posthog.capture('dropoff_scheduled', {
                accepted_count: acceptedDonations?.length ?? 0,
                rejected_count: rejectedDonations?.length ?? 0
            });
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error submitting accept/reject email', error);
            posthog.captureException(error);
            if (error instanceof Error && error.message.startsWith('Category not found:')) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('An unexpected error occurred while processing donations. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
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

        fetchEvents();
    }, []);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <IconButton onClick={() => setOpenScheduler(false)}>
                    <ArrowBackIcon />
                </IconButton>
                <h3>Send Accept/Reject Email</h3>
            </div>
            {isLoading ? (
                <Loader />
            ) : (
                <>
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
                                minRows={4}
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
                                            Select Calendar (Optional)
                                        </option>
                                        {events
                                            ?.filter((event) => event.active === true)
                                            .map((event) => (
                                                <option key={event.uri || event.scheduling_url || event.name} value={event.scheduling_url}>
                                                    {event.name}
                                                </option>
                                            ))}
                                    </NativeSelect>
                                </FormControl>
                            )}
                            <Box sx={{ marginTop: '2em' }} display={'flex'} gap={2}>
                                <Button onClick={handleSubmit} variant="contained">
                                    Send Email
                                </Button>
                                <Button variant="outlined" type="button" onClick={() => setOpenScheduler(false)}>
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    </div>
                </>
            )}
            <CustomDialog isOpen={isDialogOpen} onClose={handleClose} title="Email sent" content={`Email successfully sent to ${donorEmail}`} />
            <CustomDialog
                isOpen={errorMessage !== ''}
                onClose={() => setErrorMessage('')}
                title="Error Processing Donations"
                content={errorMessage}
            />
        </ProtectedAdminRoute>
    );
};

export default ScheduleDropOff;
