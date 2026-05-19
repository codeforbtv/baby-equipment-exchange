'use client';

//Hooks
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from 'react';
import { renderToString } from 'react-dom/server';
//Components
import DonationCardSmall from './DonationCardSmall';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Box, Button, FormControl, InputLabel, NativeSelect, TextField } from '@mui/material';
import CustomDialog from './CustomDialog';
import Loader from './Loader';
//Api
import { getSchedulingPageLink } from '@/api/calendly';
import { addErrorEvent } from '@/api/firebase';
import { closeOrder, updateDonation } from '@/api/firebase-donations';
import sendMail from '@/api/nodemailer';
//styles
import '@/styles/globalStyles.css';
//types
import { EventType } from '@/types/CalendlyTypes';
import { Order } from '@/types/OrdersTypes';

import cancelOrder from '@/email-templates/cancelOrder';

type CancelOrderProps = {
    order: Order;
    shouldShow: Dispatch<SetStateAction<boolean>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
    onComplete?: () => void;
};

const CancelOrder = (props: CancelOrderProps) => {
    const { order, shouldShow, setNotificationsUpdated, onComplete } = props;
    const { requestor, id, items, rejectedItems } = order;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [events, setEvents] = useState<EventType[] | null>(null);
    const [inviteUrl, setInviteUrl] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleClose = () => {
        setIsDialogOpen(false);
        if (setNotificationsUpdated) setNotificationsUpdated(true);
        shouldShow(false);
        if (onComplete) onComplete();
    };

    const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        setInviteUrl(event.target.value);
    };

    const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value);

    const handleSubmit = async () => {
        setIsLoading(true);
        const tagNumbers = [...items, ...(rejectedItems ?? [])].flatMap((item) => (item.tagNumber ? [item.tagNumber] : []));
        const emailMsg = cancelOrder(requestor.email, renderToString(message), tagNumbers, notes, inviteUrl);

        try {
            await Promise.all(
                items.map((item) =>
                    updateDonation(item.id, {
                        status: 'available',
                        requestor: null
                    })
                )
            );
            await closeOrder(id);
            await sendMail(emailMsg);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error submitting order cancellation email', error);
        } finally {
            setIsLoading(false);
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
            <p>{`Hello ${requestor.name},`}</p>
            {items.length > 0 && (
                <>
                    <p>Your request for the following items has been cancelled. These items will be returned to available inventory.</p>
                    {items.map((item) => (
                        <DonationCardSmall key={item.id} donation={item} />
                    ))}
                </>
            )}
            {rejectedItems && rejectedItems.length > 0 && (
                <>
                    <p>Unfortunately, the following requested items are no longer available:</p>
                    {rejectedItems.map((item) => (
                        <DonationCardSmall key={item.id} donation={item} />
                    ))}
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
                <h3>Send Order Update Email</h3>
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
                                    Select calendar for follow up
                                </InputLabel>
                                <NativeSelect variant="outlined" name="location" id="location" onChange={handleSelect} value={inviteUrl}>
                                    <option value="">No follow-up calendar</option>
                                    {events &&
                                        events.map((event) => {
                                            if (event.active === true) {
                                                return (
                                                    <option key={event.uri} value={event.scheduling_url}>
                                                        {event.name}
                                                    </option>
                                                );
                                            }
                                            return null;
                                        })}
                                </NativeSelect>
                            </FormControl>
                            <Box sx={{ marginTop: '2em' }} display={'flex'} gap={2}>
                                <Button variant="contained" onClick={handleSubmit}>
                                    Send Email and Close Order
                                </Button>
                                <Button variant="outlined" onClick={() => shouldShow(false)}>
                                    Back
                                </Button>
                            </Box>
                        </Box>
                    </div>
                </>
            )}
            <CustomDialog isOpen={isDialogOpen} onClose={handleClose} title="Email sent" content={`Email successfully sent to ${requestor.email}`} />
        </ProtectedAdminRoute>
    );
};

export default CancelOrder;
