'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Checkbox, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import DonationForm from '@/components/DonationForm';
import PendingDonations from '@/components/PendingDonations';
import CustomDialog from '@/components/CustomDialog';
import Loader from '@/components/Loader';
import SchedulePickup from '@/components/SchedulePickup';
import { usePendingDonationsContext } from '@/contexts/PendingDonationsContext';
import { useUserContext } from '@/contexts/UserContext';
import { uploadImages } from '@/api/firebase-images';
import { addErrorEvent } from '@/api/firebase';
import { addAdminDonation, getOrderById } from '@/api/firebase-donations';
import { getAllActiveDbUsers } from '@/api/firebase-users';
import { extractEmail } from '@/utils/utils';
import { AdminDonationBody, DonationFormData } from '@/types/DonationTypes';
import { IUser } from '@/models/user';
import { Order } from '@/types/OrdersTypes';
import '@/styles/globalStyles.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AdminDonationFlowProps = {
    title?: string;
};

type RequestorInfo = {
    id: string;
    name: string;
    email: string;
};

export default function AdminDonationFlow({ title = 'Create donation' }: AdminDonationFlowProps) {
    const [showForm, setShowForm] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [submissionError, setSubmissionError] = useState<string>('');
    const [submitOnBehalf, setSubmitOnBehalf] = useState<boolean>(false);
    const [donorName, setDonorName] = useState<string>('');
    const [donorEmail, setDonorEmail] = useState<string>('');
    const [activeUsers, setActiveUsers] = useState<IUser[] | null>(null);
    const [addToOrder, setAddToOrder] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [showScheduler, setShowScheduler] = useState<boolean>(false);
    const isSubmittingRef = useRef<boolean>(false);

    const { currentUser } = useUserContext();
    const { pendingDonations, clearPendingDonations } = usePendingDonationsContext();

    const donorEmailIsValid = emailRegex.test(donorEmail.trim());
    const donorDetailsAreValid = donorName.trim().length > 0 && donorEmailIsValid;
    const isSubmitDisabled = isSubmitting || pendingDonations.length === 0 || !donorDetailsAreValid || (addToOrder && !currentOrder && !selectedUser);

    useEffect(() => {
        if (!submitOnBehalf && currentUser) {
            setDonorName(currentUser.displayName ?? '');
            setDonorEmail(currentUser.email ?? '');
        }
    }, [currentUser, submitOnBehalf]);

    const fetchActiveUsers = useCallback(async (): Promise<void> => {
        try {
            const activeUsersResult = await getAllActiveDbUsers();
            setActiveUsers(activeUsersResult);
        } catch (error) {
            addErrorEvent('Error fetching active users', error);
        }
    }, []);

    useEffect(() => {
        fetchActiveUsers();
    }, [fetchActiveUsers]);

    useEffect(() => {
        const requestedOrderId = new URLSearchParams(window.location.search).get('orderId');
        if (!requestedOrderId) {
            return;
        }

        setOrderId(requestedOrderId);
        setAddToOrder(true);
        setIsLoading(true);
        getOrderById(requestedOrderId)
            .then((order) => {
                setCurrentOrder(order);
                setSelectedUser(`${order.requestor.name} (${order.requestor.email})`);
            })
            .catch((error) => addErrorEvent('Fetch order for admin donation', error))
            .finally(() => setIsLoading(false));
    }, []);

    const handleSubmitOnBehalfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setSubmitOnBehalf(isChecked);
        if (!isChecked && currentUser) {
            setDonorName(currentUser.displayName ?? '');
            setDonorEmail(currentUser.email ?? '');
        }
    };

    const getRequestor = (): RequestorInfo | undefined => {
        if (!addToOrder) {
            return undefined;
        }
        if (currentOrder) {
            return currentOrder.requestor;
        }
        if (!selectedUser || !activeUsers) {
            return undefined;
        }

        const requestorEmailMatch = extractEmail(selectedUser);
        if (!requestorEmailMatch) {
            throw new Error('Requestor email not found.');
        }

        const requestor = activeUsers.find((user) => user.email === requestorEmailMatch[0]);
        if (!requestor) {
            throw new Error('Selected requestor not found.');
        }

        return {
            id: requestor.uid,
            name: requestor.displayName,
            email: requestor.email
        };
    };

    async function convertPendingDonations(donations: DonationFormData[]): Promise<AdminDonationBody[]> {
        if (!currentUser?.uid) {
            return Promise.reject(new Error('You must be logged in as an admin to submit donations.'));
        }

        const bulkDonations: AdminDonationBody[] = [];
        try {
            for (const donation of donations) {
                let imageURLs: string[] = [];
                if (donation.images) {
                    imageURLs = await uploadImages(donation.images);
                }

                const quantity = Math.max(1, Math.floor(Number(donation.quantity ?? 1)));
                for (let index = 0; index < quantity; index++) {
                    bulkDonations.push({
                        donorName: donorName.trim(),
                        donorEmail: donorEmail.trim(),
                        donorId: currentUser.uid,
                        brand: donation.brand ?? '',
                        category: donation.category ?? '',
                        model: donation.model ?? '',
                        description: donation.description ?? '',
                        images: imageURLs
                    });
                }
            }

            return bulkDonations;
        } catch (error) {
            addErrorEvent('Convert admin pending donations', error);
            throw error;
        }
    }

    async function handleFormSubmit(event: React.SyntheticEvent) {
        event.preventDefault();
        if (isSubmitDisabled || isSubmittingRef.current) {
            return;
        }

        isSubmittingRef.current = true;
        setIsSubmitting(true);
        setSubmissionError('');

        try {
            const donationsToUpload = await convertPendingDonations(pendingDonations);
            const order = await addAdminDonation(donationsToUpload, getRequestor(), orderId ?? undefined);
            clearPendingDonations();
            localStorage.removeItem('pendingDonations');
            setShowForm(true);

            if (order) {
                setCurrentOrder(order);
                setShowScheduler(true);
            } else {
                setIsOpen(true);
            }
        } catch (error) {
            addErrorEvent('Error submitting admin donation', error);
            setSubmissionError('The donation could not be submitted. Please try again.');
        } finally {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
    }

    if (showScheduler && currentOrder) {
        return <SchedulePickup order={currentOrder} setShowScheduler={setShowScheduler} />;
    }

    return (
        <>
            <div className="page--header">
                <Typography variant="h4" sx={{ marginTop: '1em' }}>
                    {title}
                </Typography>
            </div>
            {isLoading ? (
                <Loader />
            ) : (
                <Stack direction="column" spacing={2}>
                    <Box className="content--container" display="flex" flexDirection="column" gap={2}>
                        <FormControlLabel
                            control={<Checkbox checked={submitOnBehalf} onChange={handleSubmitOnBehalfChange} />}
                            label="Submit this donation on behalf of another person"
                        />
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <TextField
                                label="Donor name"
                                value={donorName}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDonorName(event.target.value)}
                                disabled={!submitOnBehalf}
                                required
                                fullWidth
                                error={donorName.trim().length === 0}
                                helperText={donorName.trim().length === 0 ? 'Donor name is required.' : undefined}
                            />
                            <TextField
                                label="Donor email"
                                value={donorEmail}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDonorEmail(event.target.value)}
                                disabled={!submitOnBehalf}
                                required
                                fullWidth
                                error={donorEmail.length > 0 && !donorEmailIsValid}
                                helperText={donorEmail.length > 0 && !donorEmailIsValid ? 'Enter a valid email address.' : undefined}
                            />
                        </Stack>
                        {submitOnBehalf && (
                            <Alert severity="info">
                                These details will be saved as the donor on each item in this submission. Your admin account remains the submitter.
                            </Alert>
                        )}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={addToOrder}
                                    disabled={Boolean(orderId)}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                        setAddToOrder(event.target.checked);
                                        if (!event.target.checked) {
                                            setSelectedUser(null);
                                        }
                                    }}
                                />
                            }
                            label="Add submitted donations to a pickup order"
                        />
                        {addToOrder && currentOrder && (
                            <Typography variant="body2">
                                {`Adding donations to ${currentOrder.requestor.name}'s order (${currentOrder.requestor.email})`}
                            </Typography>
                        )}
                        {addToOrder && activeUsers && !currentOrder && (
                            <Autocomplete
                                value={selectedUser}
                                onChange={(_event: any, newValue: string | null) => setSelectedUser(newValue)}
                                id="requestor-select"
                                options={activeUsers.map((user) => `${user.displayName} (${user.email})`)}
                                renderInput={(params) => <TextField {...params} label="Requestor" required />}
                            />
                        )}
                    </Box>

                    {showForm && <DonationForm setShowForm={setShowForm} keepFormOpenAfterAdd keepFormOpenAfterCancel includeInactiveCategories />}

                    {pendingDonations.length > 0 && <PendingDonations />}

                    <Box display="flex" justifyContent="flex-start">
                        <Button
                            variant="contained"
                            size="medium"
                            type="submit"
                            endIcon={isSubmitting ? undefined : <UploadOutlinedIcon />}
                            onClick={handleFormSubmit}
                            disabled={isSubmitDisabled}
                        >
                            {isSubmitting ? 'Submitting...' : pendingDonations.length > 1 ? 'Submit Donations' : 'Submit Donation'}
                        </Button>
                    </Box>
                    {submissionError && <Alert severity="error">{submissionError}</Alert>}
                </Stack>
            )}
            <CustomDialog
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Donation submitted"
                content="The donation has been submitted and added to available inventory."
            />
        </>
    );
}
