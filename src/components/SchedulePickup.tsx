'use client';

//Hooks
import {
    ChangeEvent,
    Dispatch,
    SetStateAction,
    useEffect,
    useState
} from 'react';
import { useRouter } from 'next/navigation';
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
//Api
import {
    getAdminSchedulingPageLinks,
    sendPickupSchedulingEmail,
    type SchedulingPageLinkOption
} from '@/app/actions/scheduling-public';
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
    setShowScheduler?: Dispatch<SetStateAction<boolean>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
    onClose?: () => void;
};

const SchedulePickup = (props: SchedulePickupProps) => {
    const { order, setShowScheduler, setNotificationsUpdated, onClose } = props;
    const { requestor, id, items, rejectedItems } = order;
    const router = useRouter();

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
        if (onClose) {
            onClose();
            return;
        }

        if (setShowScheduler) {
            setShowScheduler(false);
            return;
        }

        router.push('/');
    };

    const handleSuccessDialogClose = () => {
        setIsSuccessDialogOpen(false);
        if (setNotificationsUpdated) {
            setNotificationsUpdated(true);
        }
        closeWorkflow();
    };

    const handleSchedulingOptionChange = (
        event: ChangeEvent<HTMLSelectElement>
    ) => {
        setSelectedEventTypeUri(event.target.value);
    };
    const handleEmailNotesChange = (event: ChangeEvent<HTMLTextAreaElement>) =>
        setEmailNotes(event.target.value);

    const handleCancel = () => closeWorkflow();

    const handleSendPickupEmail = async () => {
        setIsSubmitting(true);
        try {
            const idToken = await getAuthIdToken();
            const selectedSchedulingUrl = schedulingOptions?.find(
                (option) => option.uri === selectedEventTypeUri
            )?.scheduling_url;
            await sendPickupSchedulingEmail({
                idToken,
                orderId: id,
                eventTypeUri: selectedEventTypeUri || undefined,
                notes: emailNotes
            });
            await schedulePickupForOrder(order, selectedSchedulingUrl);
            posthog.capture('pickup_scheduled', {
                order_id: id,
                item_count: items.length
            });
            setIsSuccessDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error submitting schedule pickup email', error);
            posthog.captureException(error);
            setErrorMessage(
                'Something went wrong while scheduling the pickup. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const emailPreview = (
        <>
            <p>{`Hello ${requestor.name}`}</p>
            <p>Your request for the following items has been fulfilled:</p>
            {items.map((item) => (
                <DonationCardSmall
                    key={item.id}
                    donation={item}
                />
            ))}
            {rejectedItems && rejectedItems.length > 0 && (
                <>
                    <p>
                        Unfortunately, the following items you requested are no
                        longer available:
                    </p>
                    {rejectedItems?.map((item) => (
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
                <h3>Send Pickup Scheduling Email</h3>
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
                                <InputLabel
                                    variant="standard"
                                    htmlFor="location"
                                    shrink={true}
                                >
                                    Select calendar for accepted donations
                                </InputLabel>
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
                                        schedulingOptions.map(
                                            (option, index) => {
                                                return (
                                                    <option
                                                        key={
                                                            option.uri || index
                                                        }
                                                        value={option.uri}
                                                    >
                                                        {option.name}
                                                    </option>
                                                );
                                            }
                                        )}
                                </NativeSelect>
                            </FormControl>
                            <Box
                                sx={{ marginTop: '2em' }}
                                display={'flex'}
                                gap={2}
                            >
                                <Button
                                    variant="contained"
                                    onClick={handleSendPickupEmail}
                                >
                                    Send Email
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleCancel}
                                >
                                    Cancel
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

export default SchedulePickup;
