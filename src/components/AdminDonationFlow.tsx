'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Button, Checkbox, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import DonationForm from '@/components/DonationForm';
import PendingDonations from '@/components/PendingDonations';
import CustomDialog from '@/components/CustomDialog';
import { usePendingDonationsContext } from '@/contexts/PendingDonationsContext';
import { useUserContext } from '@/contexts/UserContext';
import { uploadImages } from '@/api/firebase-images';
import { addErrorEvent } from '@/api/firebase';
import { addAdminDonation } from '@/api/firebase-donations';
import { getTagNumber } from '@/api/firebase-categories';
import { AdminDonationBody, DonationFormData } from '@/types/DonationTypes';
import '@/styles/globalStyles.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AdminDonationFlowProps = {
    title?: string;
};

export default function AdminDonationFlow({ title = 'Create donation' }: AdminDonationFlowProps) {
    const [showForm, setShowForm] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [submissionError, setSubmissionError] = useState<string>('');
    const [submitOnBehalf, setSubmitOnBehalf] = useState<boolean>(false);
    const [donorName, setDonorName] = useState<string>('');
    const [donorEmail, setDonorEmail] = useState<string>('');

    const { currentUser } = useUserContext();
    const { pendingDonations, clearPendingDonations } = usePendingDonationsContext();

    const donorEmailIsValid = emailRegex.test(donorEmail);
    const donorDetailsAreValid = donorName.trim().length > 0 && donorEmailIsValid;
    const isSubmitDisabled = isSubmitting || pendingDonations.length === 0 || !donorDetailsAreValid;

    useEffect(() => {
        if (!submitOnBehalf && currentUser) {
            setDonorName(currentUser.displayName ?? '');
            setDonorEmail(currentUser.email ?? '');
        }
    }, [currentUser, submitOnBehalf]);

    const handleSubmitOnBehalfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setSubmitOnBehalf(isChecked);
        if (!isChecked && currentUser) {
            setDonorName(currentUser.displayName ?? '');
            setDonorEmail(currentUser.email ?? '');
        }
    };

    async function convertPendingDonations(donations: DonationFormData[]): Promise<AdminDonationBody[]> {
        if (!currentUser?.uid) {
            return Promise.reject(new Error('You must be logged in as an admin to submit donations.'));
        }

        const donor = {
            name: donorName.trim(),
            email: donorEmail.trim()
        };
        const bulkDonations: AdminDonationBody[] = [];

        try {
            for (const donation of donations) {
                let imageURLs: string[] = [];
                if (donation.images) {
                    imageURLs = await uploadImages(donation.images);
                }

                const tagNumber = donation.category ? await getTagNumber(donation.category) : await getTagNumber('Other');

                bulkDonations.push({
                    donorName: donor.name,
                    donorEmail: donor.email,
                    donorId: currentUser.uid,
                    brand: donation.brand ?? '',
                    category: donation.category ?? '',
                    model: donation.model ?? '',
                    description: donation.description ?? '',
                    images: imageURLs,
                    tagNumber
                });
            }

            return bulkDonations;
        } catch (error) {
            addErrorEvent('Convert admin pending donations', error);
            throw error;
        }
    }

    async function handleFormSubmit(event: React.SyntheticEvent) {
        event.preventDefault();
        setIsSubmitting(true);
        setSubmissionError('');

        try {
            const donationsToUpload = await convertPendingDonations(pendingDonations);
            await addAdminDonation(donationsToUpload);
            clearPendingDonations();
            localStorage.removeItem('pendingDonations');
            setShowForm(true);
            setIsOpen(true);
        } catch (error) {
            addErrorEvent('Error submitting admin donation', error);
            setSubmissionError('The donation could not be submitted. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <div className="page--header">
                <Typography variant="h4" sx={{ marginTop: '1em' }}>
                    {title}
                </Typography>
            </div>
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
                </Box>

                {showForm && (
                    <DonationForm setShowForm={setShowForm} keepFormOpenAfterAdd keepFormOpenAfterCancel includeInactiveCategories />
                )}

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
            <CustomDialog
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Donation submitted"
                content="The donation has been submitted and added to available inventory."
            />
        </>
    );
}
