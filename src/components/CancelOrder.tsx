'use client';

//Hooks
import {
    ChangeEvent,
    Dispatch,
    SetStateAction,
    useEffect,
    useState
} from 'react';
//Components
import DonationCardSmall from './DonationCardSmall';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    NativeSelect,
    TextField
} from '@mui/material';
import CustomDialog from './CustomDialog';
import Loader from './Loader';
//Api
import {
    getAdminSchedulingPageLinks,
    sendCancelOrderSchedulingEmail,
    type SchedulingPageLinkOption
} from '@/app/actions/scheduling-public';
import { addErrorEvent, getAuthIdToken } from '@/api/firebase';
import { cancelOrderAndReturnItems } from '@/api/firebase-donations';
//styles
import '@/styles/globalStyles.css';
//types
import { Order } from '@/types/OrdersTypes';

type CancelOrderProps = {
    order: Order;
    shouldShow: Dispatch<SetStateAction<boolean>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
    onComplete?: () => void;
};

const CancelOrder = (props: CancelOrderProps) => {
    const { order, shouldShow, setNotificationsUpdated, onComplete } = props;
    const { requestor, items, rejectedItems } = order;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [events, setEvents] = useState<SchedulingPageLinkOption[] | null>(
        null
    );
    const [inviteUrl, setInviteUrl] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleClose = () => {
        setIsDialogOpen(false);
        if (setNotificationsUpdated) setNotificationsUpdated(true);
        shouldShow(false);
        if (onComplete) onComplete();
    };

    const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        setInviteUrl(event.target.value);
    };

    const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) =>
        setNotes(event.target.value);

    const handleSubmit = async () => {
        setIsLoading(true);

        try {
            const idToken = await getAuthIdToken();
            await sendCancelOrderSchedulingEmail({
                idToken,
                orderId: order.id,
                eventTypeUri: inviteUrl || undefined,
                notes
            });
            await cancelOrderAndReturnItems(order);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error submitting order cancellation email', error);
            setErrorMessage(
                'Something went wrong while cancelling the order. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const message = (
        <>
            <p>{`Hello ${requestor.name},`}</p>
            {items.length > 0 && (
                <>
                    <p>
                        Your request for the following items has been cancelled.
                        These items will be returned to available inventory.
                    </p>
                    {items.map((item) => (
                        <DonationCardSmall
                            key={item.id}
                            donation={item}
                        />
                    ))}
                </>
            )}
            {rejectedItems && rejectedItems.length > 0 && (
                <>
                    <p>
                        Unfortunately, the following requested items are no
                        longer available:
                    </p>
                    {rejectedItems.map((item) => (
                        <DonationCardSmall
                            key={item.id}
                            donation={item}
                        />
                    ))}
                </>
            )}
        </>
    );

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventResult = await getAdminSchedulingPageLinks({
                    idToken: await getAuthIdToken()
                });
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
                <h3>Send Order Update Email</h3>
            </div>
            {isLoading ? (
                <Loader />
            ) : (
                <>
                    <p>{`The following email will be sent to ${requestor.email}`}</p>
                    <div className="content--container">
                        <Box
                            display={'flex'}
                            flexDirection={'column'}
                        >
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
                            <FormControl
                                fullWidth
                                sx={{ marginTop: '2em' }}
                            >
                                <NativeSelect
                                    variant="outlined"
                                    name="location"
                                    id="location"
                                    onChange={handleSelect}
                                    value={inviteUrl}
                                >
                                    <option value="">
                                        No scheduling invite
                                    </option>
                                    {events &&
                                        events.map((event) => (
                                            <option
                                                key={event.uri}
                                                value={event.uri}
                                            >
                                                {event.name}
                                            </option>
                                        ))}
                                </NativeSelect>
                            </FormControl>
                            <Box
                                sx={{ marginTop: '2em' }}
                                display={'flex'}
                                gap={2}
                            >
                                <Button
                                    variant="contained"
                                    onClick={handleSubmit}
                                >
                                    Send Email and Close Order
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => shouldShow(false)}
                                >
                                    Back
                                </Button>
                            </Box>
                        </Box>
                    </div>
                </>
            )}
            <CustomDialog
                isOpen={isDialogOpen}
                onClose={handleClose}
                title="Email sent"
                content={`Email successfully sent to ${requestor.email}`}
            />
            <CustomDialog
                isOpen={!!errorMessage}
                onClose={() => setErrorMessage('')}
                title="Error"
                content={errorMessage}
            />
        </ProtectedAdminRoute>
    );
};

export default CancelOrder;
