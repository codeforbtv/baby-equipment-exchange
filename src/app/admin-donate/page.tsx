'use client';

//Hooks
import { useEffect, useState } from 'react';
import { usePendingDonationsContext } from '@/contexts/PendingDonationsContext';
import { useUserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import { Button, IconButton, Stack } from '@mui/material';
import Loader from '@/components/Loader';
import AdminDonationForm from '@/components/AdminDonationForm';
import PendingDonations from '@/components/PendingDonations';
import CustomDialog from '@/components/CustomDialog';
import SchedulePickup from '@/components/SchedulePickup';
//Api
import { uploadImages } from '@/api/firebase-images';
import { addErrorEvent } from '@/api/firebase';
import { addAdminDonation, getOrderById } from '@/api/firebase-donations';
//Icons
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//styles
import '@/styles/globalStyles.css';
//Types
import { AdminDonationBody, DonationFormData } from '@/types/DonationTypes';
import { Order } from '@/types/OrdersTypes';

export default function AdminDonate() {
    const [showForm, setShowForm] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [showScheduler, setShowScheduler] = useState<boolean>(false);

    const { currentUser } = useUserContext();
    const { pendingDonations, clearPendingDonations } = usePendingDonationsContext();
    const router = useRouter();

    const handleClose = () => {
        setIsOpen(false);
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
                    const newDonation = {
                        donorName: currentUser.displayName,
                        donorEmail: currentUser.email,
                        donorId: currentUser.uid,
                        brand: donation.brand ?? '',
                        category: donation.category ?? '',
                        model: donation.model ?? '',
                        description: donation.description ?? '',
                        images: imageURLs
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
            const updatedOrder = await addAdminDonation(donationsToUpload, currentOrder?.requestor, orderId ?? undefined);
            clearPendingDonations();
            localStorage.removeItem('pendingDonations');
            if (updatedOrder) {
                setCurrentOrder(updatedOrder);
                setShowScheduler(true);
            } else {
                setIsOpen(true);
            }
        } catch (error) {
            addErrorEvent('Error submiting admin donation', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }

    //show form if all pending donations are deleted
    useEffect(() => {
        if (!showForm && pendingDonations.length === 0) {
            setShowForm(true);
        }
    }, [pendingDonations, showForm]);

    useEffect(() => {
        const requestedOrderId = new URLSearchParams(window.location.search).get('orderId');
        if (!requestedOrderId) {
            return;
        }

        setOrderId(requestedOrderId);
        setIsLoading(true);
        getOrderById(requestedOrderId)
            .then(setCurrentOrder)
            .catch((error) => addErrorEvent('Fetch order for admin donation', error))
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <ProtectedAdminRoute>
            {showScheduler && currentOrder ? (
                <SchedulePickup order={currentOrder} setShowScheduler={setShowScheduler} />
            ) : (
                <div className="page--header">
                    <h3>Create donation</h3>
                    <IconButton onClick={() => router.push('./')}>
                        <ArrowBackIcon />
                    </IconButton>
                </div>
            )}
            {isLoading ? (
                <Loader />
            ) : !showScheduler ? (
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
            ) : null}
            <CustomDialog isOpen={isOpen} onClose={handleClose} title="Donation Submitted" content="Your donation has been successfully submitted." />
        </ProtectedAdminRoute>
    );
}
