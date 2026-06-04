'use client';

//Hooks
import { useEffect, useState } from 'react';
import { usePendingDonationsContext } from '@/contexts/PendingDonationsContext';
import { useUserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import Loader from '@/components/Loader';
import AdminDonationForm from '@/components/AdminDonationForm';
import PendingDonations from '@/components/PendingDonations';
import CustomDialog from '@/components/CustomDialog';
//Api
import { uploadImages } from '@/api/firebase-images';
import { addErrorEvent } from '@/api/firebase';
import { addAdminDonation } from '@/api/firebase-donations';
import { getTagNumber } from '@/api/firebase-categories';
import sendMail from '@/api/nodemailer';
import adminDonationAdded from '@/email-templates/adminDonationAdded';
//Icons
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//styles
import '@/styles/globalStyles.css';
//Types
import { AdminDonationBody, DonationFormData } from '@/types/DonationTypes';

export default function AdminDonate() {
    const [showForm, setShowForm] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [submittedDonations, setSubmittedDonations] = useState<AdminDonationBody[]>([]);

    const { currentUser } = useUserContext();
    const { pendingDonations, clearPendingDonations } = usePendingDonationsContext();
    const router = useRouter();

    const handleClose = () => {
        setIsOpen(false);
        setSubmittedDonations([]);
        router.push('/');
    };

    async function convertPendingDonations(pendingDonations: DonationFormData[]): Promise<AdminDonationBody[]> {
        const bulkDonations: AdminDonationBody[] = [];
        if (currentUser && currentUser.uid && currentUser.displayName && currentUser.email) {
            try {
                for (const donation of pendingDonations) {
                    let imageURLs: string[] = [];
                    if (donation.images) {
                        imageURLs = await uploadImages(donation.images);
                    }
                    //generate tag number using 'Other' category if category somehow isn't provided
                    const tagNumber = donation.category ? await getTagNumber(donation.category) : await getTagNumber('Other');

                    const newDonation = {
                        donorName: currentUser.displayName,
                        donorEmail: currentUser.email,
                        donorId: currentUser.uid,
                        brand: donation.brand ?? '',
                        category: donation.category ?? '',
                        model: donation.model ?? '',
                        description: donation.description ?? '',
                        images: imageURLs,
                        tagNumber: tagNumber
                    };
                    bulkDonations.push(newDonation);
                }
                return bulkDonations;
            } catch (error) {
                addErrorEvent('convertPendingDonations', error);
                throw error;
            }
        } else {
            return Promise.reject(new Error('You must be logged in to donate.'));
        }
    }

    async function handleFormSubmit(event: React.SyntheticEvent) {
        event.preventDefault();
        setIsLoading(true);
        try {
            const donationsToUpload: AdminDonationBody[] = await convertPendingDonations(pendingDonations);
            await addAdminDonation(donationsToUpload);
            clearPendingDonations();
            localStorage.clear();
            if (currentUser?.email && currentUser?.displayName) {
                const emailMsg = adminDonationAdded(currentUser.email, currentUser.displayName, donationsToUpload);
                await sendMail(emailMsg);
            }
            setSubmittedDonations(donationsToUpload);
            setIsOpen(true);
        } catch (error) {
            addErrorEvent('Error submiting admin donation', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }

    //show form if all pending donations are deleted
    useEffect(() => {
        if (!showForm && pendingDonations.length === 0) setShowForm(true);
    }, [pendingDonations, showForm]);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <h3>Create donation</h3>
                <IconButton onClick={() => router.push('./')}>
                    <ArrowBackIcon />
                </IconButton>
            </div>
            {isLoading ? (
                <Loader />
            ) : (
                <Stack direction="column" spacing={2}>
                    {showForm && <AdminDonationForm setShowForm={setShowForm} />}
                    <hr />
                    {pendingDonations.length > 0 && <PendingDonations />}

                    {!showForm && pendingDonations.length > 0 && (
                        <Stack direction="column" spacing={2}>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
                                Add Another Item
                            </Button>
                            <Button variant="contained" size="medium" type="submit" endIcon={<UploadOutlinedIcon />} onClick={handleFormSubmit}>
                                {pendingDonations.length > 1 ? 'Submit Donations' : 'Submit Donation'}
                            </Button>
                        </Stack>
                    )}
                </Stack>
            )}
            <CustomDialog
                isOpen={isOpen}
                onClose={handleClose}
                title="Items Added to Inventory"
                content={
                    submittedDonations.length > 0 ? (
                        <Box>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                {submittedDonations.length} {submittedDonations.length === 1 ? 'item has' : 'items have'} been added to inventory:
                            </Typography>
                            {submittedDonations.map((donation, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        py: 1,
                                        borderBottom: index < submittedDonations.length - 1 ? '1px solid #e0e0e0' : 'none'
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={donation.images?.[0] || ''}
                                        alt={`${donation.brand} ${donation.model}`}
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            objectFit: 'cover',
                                            borderRadius: 1,
                                            bgcolor: '#f1f1f1',
                                            flexShrink: 0,
                                            display: donation.images?.[0] ? 'block' : 'none'
                                        }}
                                    />
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="body1">
                                            {donation.brand} {donation.model} — <b>{donation.tagNumber}</b>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {donation.category}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        'Your donation has been successfully submitted.'
                    )
                }
            />
        </ProtectedAdminRoute>
    );
}
