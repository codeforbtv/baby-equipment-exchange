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
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
    onClose?: () => void;
    onComplete?: () => void;
};

const CancelOrder = (props: CancelOrderProps) => {
    const { order, setNotificationsUpdated, onClose, onComplete } = props;
    const { requestor, items, rejectedItems } = order;

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [schedulingOptions, setSchedulingOptions] = useState<
        SchedulingPageLinkOption[] | null
    >(null);
    const [selectedEventTypeUri, setSelectedEventTypeUri] =
        useState<string>('');
    const [emailNotes, setEmailNotes] = useState<string>('');
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] =
        useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const closeWorkflow = () => {
        onClose?.();
    };

    const handleSuccessDialogClose = () => {
        setIsSuccessDialogOpen(false);
        if (setNotificationsUpdated) {
            setNotificationsUpdated(true);
        }
        if (onComplete) {
            onComplete();
        }
        closeWorkflow();
    };

    const handleCancel = () => closeWorkflow();

    const handleSchedulingOptionChange = (
        event: ChangeEvent<HTMLSelectElement>
    ) => {
        setSelectedEventTypeUri(event.target.value);
    };

    const handleEmailNotesChange = (event: ChangeEvent<HTMLTextAreaElement>) =>
        setEmailNotes(event.target.value);

    const handleSendCancellationEmail = async () => {
        setIsSubmitting(true);

        try {
            const idToken = await getAuthIdToken();
            await sendCancelOrderSchedulingEmail({
                idToken,
                orderId: order.id,
                eventTypeUri: selectedEventTypeUri || undefined,
                notes: emailNotes
            });
            await cancelOrderAndReturnItems(order);
            setIsSuccessDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error submitting order cancellation email', error);
            setErrorMessage(
                'Something went wrong while cancelling the order. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const emailPreview = (
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
        const fetchSchedulingOptions = async () => {
            try {
                const schedulingOptionsResult =
                    await getAdminSchedulingPageLinks({
                        idToken: await getAuthIdToken()
                    });
                setSchedulingOptions(schedulingOptionsResult);
            } catch (error) {
                addErrorEvent('Fetch Calendly Scheduling Links', error);
            }
        };

        fetchSchedulingOptions();
    }, []);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <h3>Send Order Update Email</h3>
            </div>
            {isSubmitting ? (
                <Loader />
            ) : (
                <>
                    <p>{`The following email will be sent to ${requestor.email}`}</p>
                    <div className="content--container">
                        <Box
                            display={'flex'}
                            flexDirection={'column'}
                        >
                            {emailPreview}
                            <TextField
                                type="text"
                                label="Additional notes"
                                name="notes"
                                id="notes"
                                value={emailNotes}
                                multiline={true}
                                minRows={4}
                                maxRows={Infinity}
                                placeholder="Add any additional notes here"
                                onChange={handleEmailNotesChange}
                            />
                            <FormControl
                                fullWidth
                                sx={{ marginTop: '2em' }}
                            >
                                <NativeSelect
                                    variant="outlined"
                                    name="location"
                                    id="location"
                                    onChange={handleSchedulingOptionChange}
                                    value={selectedEventTypeUri}
                                >
                                    <option value="">
                                        No scheduling invite
                                    </option>
                                    {schedulingOptions &&
                                        schedulingOptions.map((option) => (
                                            <option
                                                key={option.uri}
                                                value={option.uri}
                                            >
                                                {option.name}
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
                                    onClick={handleSendCancellationEmail}
                                >
                                    Send Email and Close Order
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleCancel}
                                >
                                    Back
                                </Button>
                            </Box>
                        </Box>
                    </div>
                </>
            )}
            <CustomDialog
                isOpen={isSuccessDialogOpen}
                onClose={handleSuccessDialogClose}
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
