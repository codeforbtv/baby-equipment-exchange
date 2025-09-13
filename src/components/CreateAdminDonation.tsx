'use client';
//Hooks
import { useUserContext } from '@/contexts/UserContext';
import { usePendingDonationsContext } from '@/contexts/PendingDonationsContext';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import Loader from './Loader';
import PendingDonations from './PendingDonations';
import DonationForm from './DonationForm';
import { Button, IconButton } from '@mui/material';
//Api
import { addErrorEvent } from '@/api/firebase';
import { uploadImages } from '@/api/firebase-images';
//Icons
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//styles
import '@/styles/globalStyles.css';
//Types
import { DonationFormData, DonationBody } from '@/types/DonationTypes';
import { Dispatch, SetStateAction, useState } from 'react';
import { addAdminDonation } from '@/api/firebase-donations';
import CustomDialog from './CustomDialog';

type CreateAdminDonationProps = {
    setShowForm: Dispatch<SetStateAction<boolean>>;
    setDonationsUpdated: Dispatch<SetStateAction<boolean>>;
};

const CreateAdminDonation = (props: CreateAdminDonationProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const { setShowForm, setDonationsUpdated } = props;
    const { currentUser } = useUserContext();
    const { pendingDonations, removePendingDonation, clearPendingDonations, getPendingDonationsFromLocalStorage } = usePendingDonationsContext();

    const handleClose = () => {
        setDonationsUpdated(true);
        setIsOpen(false);
        setShowForm(false);
    };

    async function convertPendingDonations(pendingDonations: DonationFormData[]): Promise<DonationBody[]> {
        let bulkDonations: DonationBody[] = [];
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
            }
        } else {
            return Promise.reject(new Error('You must be logged in to donate.'));
        }

        return Promise.reject();
    }

    async function handleFormSubmit(event: React.SyntheticEvent) {
        event.preventDefault();
        setIsLoading(true);
        try {
            const donationsToUpload: DonationBody[] = await convertPendingDonations(pendingDonations);
            await addAdminDonation(donationsToUpload);
            clearPendingDonations();
            localStorage.clear();
            setIsOpen(true);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Error submiting admin donation', error);
        }
    }

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <h3>Create donation</h3>
            </div>
            <IconButton onClick={() => setShowForm(false)}>
                <ArrowBackIcon />
            </IconButton>
            {isLoading ? (
                <Loader />
            ) : (
                <>
                    {pendingDonations.length > 0 && <PendingDonations pendingDonations={pendingDonations} removeHandler={removePendingDonation} />}
                    <DonationForm setShowForm={setShowForm} />
                    {pendingDonations.length > 0 && (
                        <Button variant="contained" size="medium" type="submit" endIcon={<UploadOutlinedIcon />} onClick={handleFormSubmit}>
                            {pendingDonations.length > 1 ? 'Submit Donations' : 'Submit Donation'}
                        </Button>
                    )}
                </>
            )}

            <CustomDialog isOpen={isOpen} onClose={handleClose} title="Donation Submitted" content="Your donation has been successfully submitted." />
        </ProtectedAdminRoute>
    );
};

export default CreateAdminDonation;
