'use client';

//Hooks
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
//Components
import DonationCardSmall from './DonationCardSmall';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Box, Button, FormControl, InputLabel, NativeSelect, TextField } from '@mui/material';
import CustomDialog from './CustomDialog';
//Api
import { getAdminSchedulingPageLinks, sendPickupSchedulingEmail, type SchedulingPageLinkOption } from '@/app/actions/scheduling-public';
import { addErrorEvent, getAuthIdToken } from '@/api/firebase';
import { schedulePickupForOrder } from '@/api/firebase-donations';
import posthog from 'posthog-js';
//styles
import '@/styles/globalStyles.css';
//types
import { Order } from '@/types/OrdersTypes';
import Loader from './Loader';

type SchedulePickupProps = {
    order: Order;
    setShowScheduler: Dispatch<SetStateAction<boolean>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const SchedulePickup = (props: SchedulePickupProps) => {
    const { order, setShowScheduler, setNotificationsUpdated } = props;
    const { requestor, id, items, rejectedItems } = order;
    const router = useRouter();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [events, setEvents] = useState<SchedulingPageLinkOption[] | null>(null);
    const [inviteUrl, setInviteUrl] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleClose = () => {
        setIsDialogOpen(false);
        if (setNotificationsUpdated) setNotificationsUpdated(true);
        router.push('/');
    };

    const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        setInviteUrl(event.target.value);
    };
    const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const idToken = await getAuthIdToken();
            const schedulingUrl = events?.find((event) => event.uri === inviteUrl)?.scheduling_url;
            await schedulePickupForOrder(order, schedulingUrl);
            await sendPickupSchedulingEmail({ idToken, orderId: id, eventTypeUri: inviteUrl || undefined, notes });
            posthog.capture('pickup_scheduled', {
                order_id: id,
                item_count: items.length
            });
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error submitting schedule pickup email', error);
            posthog.captureException(error);
            setErrorMessage('Something went wrong while scheduling the pickup. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const message = (
        <>
            <p>{`Hello ${requestor.name}`}</p>
            <p>Your request for the following items has been fulfilled:</p>
            {items.map((item) => (
                <DonationCardSmall key={item.id} donation={item} />
            ))}
            {rejectedItems && rejectedItems.length > 0 && (
                <>
                    <p>Unfortunately, the following items you requested are no longer available:</p>
                    {rejectedItems?.map((item) => (
                        <DonationCardSmall key={item.id} donation={item} />
                    ))}
                </>
            )}
        </>
    );

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventResult = await getAdminSchedulingPageLinks({ idToken: await getAuthIdToken() });
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
                <h3>Send Pickup Scheduling Email</h3>
            </div>
            {isLoading ? (
                <Loader />
            ) : (
                <>
                    <p>{`The following email will be sent to ${requestor.email}`}</p>
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
                            />
                            <FormControl fullWidth sx={{ marginTop: '2em' }}>
                                <InputLabel variant="standard" htmlFor="location" shrink={true}>
                                    Select calendar for accepted donations
                                </InputLabel>
                                <NativeSelect variant="outlined" name="location" id="location" onChange={handleSelect} value={inviteUrl}>
                                    <option value="" disabled>
                                        Select Calendar (Optional)
                                    </option>
                                    {events &&
                                        events.map((event, index) => {
                                            return (
                                                    <option key={event.uri || index} value={event.uri}>
                                                        {event.name}
                                                    </option>
                                            );
                                        })}
                                </NativeSelect>
                            </FormControl>
                            <Box sx={{ marginTop: '2em' }} display={'flex'} gap={2}>
                                <Button variant="contained" onClick={handleSubmit}>
                                    Send Email
                                </Button>
                                <Button variant="outlined" onClick={() => setShowScheduler(false)}>
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    </div>
                </>
            )}
            <CustomDialog isOpen={isDialogOpen} onClose={handleClose} title="Email sent" content={`Email successfully sent to ${requestor.email}`} />
            <CustomDialog isOpen={!!errorMessage} onClose={() => setErrorMessage('')} title="Error" content={errorMessage} />
        </ProtectedAdminRoute>
    );
};

export default SchedulePickup;
