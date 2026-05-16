'use client';

//Hooks
import { useState, ChangeEvent, useEffect, Dispatch, SetStateAction } from 'react';
import { renderToString } from 'react-dom/server';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, NativeSelect, Select, TextField, Typography } from '@mui/material';
import DonationCardSmall from './DonationCardSmall';
import Loader from './Loader';
import CustomDialog from './CustomDialog';
//Api
import { getSchedulingPageLink } from '@/api/calendly';
import { addErrorEvent } from '@/api/firebase';
import sendMail from '@/api/nodemailer';
import accept from '@/email-templates/accept';
import reject from '@/email-templates/reject';
import { updateDonation, updateDonationStatus } from '@/api/firebase-donations';
import { getAllCategories, getTagNumber } from '@/api/firebase-categories';
//Styles
import '@/styles/globalStyles.css';
//types
import { EventType } from '@/types/CalendlyTypes';
import { Donation } from '@/models/donation';
import { Category } from '@/models/category';
import { serverTimestamp } from 'firebase/firestore';

type ScheduleDropOffProps = {
    acceptedDonations?: Donation[];
    rejectedDonations?: Donation[];
    setOpenScheduler: Dispatch<SetStateAction<boolean>>;
};

type CategoryError = {
    id: string;
    brand: string;
    model: string;
    invalidCategory: string;
};

const ScheduleDropOff = (props: ScheduleDropOffProps) => {
    const { acceptedDonations, rejectedDonations, setOpenScheduler } = props;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [events, setEvents] = useState<EventType[] | null>(null);
    const [inviteUrl, setInviteUrl] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryErrors, setCategoryErrors] = useState<CategoryError[]>([]);
    const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});

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

    const fetchEvents = async () => {
        try {
            const eventResult = await getSchedulingPageLink();
            setEvents(eventResult);
        } catch (error) {
            addErrorEvent('Fetch Calendly Scheduling Links', error);
        }
    };

    const acceptPromise = async (donations: Donation[]): Promise<string[]> => {
        const tagNumbers: string[] = [];
        const writtenDonations: Donation[] = [];

        try {
            for (const donation of donations) {
                const effectiveCategory = categoryOverrides[donation.id] || donation.category;
                const newTagNumber = await getTagNumber(effectiveCategory);
                tagNumbers.push(newTagNumber);

                const updates: Record<string, any> = {
                    status: 'pending delivery',
                    dateAccepted: serverTimestamp(),
                    tagNumber: newTagNumber
                };
                if (categoryOverrides[donation.id]) {
                    updates.category = effectiveCategory;
                }

                await updateDonation(donation.id, updates);
                writtenDonations.push(donation);
            }

            return tagNumbers;
        } catch (error) {
            for (const donation of writtenDonations) {
                try {
                    await updateDonation(donation.id, {
                        status: 'in processing',
                        dateAccepted: null,
                        tagNumber: null,
                        category: donation.category
                    });
                } catch (rollbackError) {
                    addErrorEvent('Rollback failed for donation', rollbackError);
                }
            }
            addErrorEvent('Error accepting donation', error);
            throw error;
        }
    };
    const rejectPromise = async (donations: Donation[]) => {
        await Promise.all(
            donations.map(async (donation) => {
                await updateDonationStatus(donation.id, 'rejected');
            })
        );
    };

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
        setIsLoading(true);
        setErrorMessage('');
        setCategoryErrors([]);

        try {
            let tagNumbers: string[] = [];
            if (acceptedDonations && acceptedDonations.length > 0) {
                if (categories.length > 0) {
                    const validNames = new Set(categories.map((category) => category.getName()));
                    const errors: CategoryError[] = acceptedDonations
                        .filter((donation) => !validNames.has(categoryOverrides[donation.id] || donation.category))
                        .map((donation) => ({
                            id: donation.id,
                            brand: donation.brand,
                            model: donation.model,
                            invalidCategory: donation.category
                        }));

                    if (errors.length > 0) {
                        setCategoryErrors(errors);
                        setIsLoading(false);
                        return;
                    }
                }

                tagNumbers = await acceptPromise(acceptedDonations);
            }
            if (rejectedDonations) await rejectPromise(rejectedDonations);
            const emailMsg =
                acceptedDonations && acceptedDonations.length > 0
                    ? accept(donorEmail, inviteUrl, renderToString(message), tagNumbers, notes)
                    : reject(donorEmail, renderToString(message), notes);
            await sendMail(emailMsg);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error submitting accept/reject email', error);
            setErrorMessage('An unexpected error occurred while processing donations. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCategoryOverride = (donationId: string, newCategory: string) => {
        setCategoryOverrides((prev) => ({ ...prev, [donationId]: newCategory }));
    };

    useEffect(() => {
        fetchEvents();
        getAllCategories()
            .then(setCategories)
            .catch((error) => addErrorEvent('Fetch categories', error));
    }, []);

    const allErrorsCorrected = categoryErrors.length > 0 && categoryErrors.every((error) => categoryOverrides[error.id]);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
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
                            {categoryErrors.length > 0 && (
                                <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                        {categoryErrors.length === 1
                                            ? '1 item has an unrecognized category'
                                            : `${categoryErrors.length} items have unrecognized categories`}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        Select a valid category for each item, then click &ldquo;Send Email&rdquo; again.
                                    </Typography>
                                    {categoryErrors.map((error) => (
                                        <Box key={error.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                            <Box sx={{ minWidth: 160 }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {error.brand} {error.model}
                                                </Typography>
                                                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'var(--error)' }}>
                                                    {error.invalidCategory}
                                                </Typography>
                                            </Box>
                                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                                <Select
                                                    value={categoryOverrides[error.id] || ''}
                                                    onChange={(event) => handleCategoryOverride(error.id, event.target.value as string)}
                                                    displayEmpty
                                                >
                                                    <MenuItem value="" disabled>
                                                        Select category
                                                    </MenuItem>
                                                    {categories.map((category) => (
                                                        <MenuItem key={category.getId()} value={category.getName()}>
                                                            {category.getName()}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    ))}
                                </Alert>
                            )}
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
                                <Button onClick={handleSubmit} variant="contained" disabled={categoryErrors.length > 0 && !allErrorsCorrected}>
                                    {allErrorsCorrected ? 'Retry & Send Email' : 'Send Email'}
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
            <CustomDialog isOpen={errorMessage !== ''} onClose={() => setErrorMessage('')} title="Error Processing Donations" content={errorMessage} />
        </ProtectedAdminRoute>
    );
};

export default ScheduleDropOff;
