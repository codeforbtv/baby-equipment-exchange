'use client';

//Hooks
import { useEffect, useState } from 'react';
//APi
import { addErrorEvent } from '@/api/firebase';
import { getDonationById } from '@/api/firebase-donations';
//Components
import Loader from '@/components/Loader';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
//Styles
import '@/styles/globalStyles.css';
//Types
import { IDonation, DonationStatuses, DonationStatusKeys, DonationStatusValues, donationStatuses } from '@/models/donation';

import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';

export default function DonationDetails({ params }: { params: { id: string } }) {
    const [donationDetails, setDonationDetails] = useState<IDonation | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);

    const initialStatus: DonationStatusValues = donationDetails ? donationDetails.status : 'in processing';

    const statusSelectOptions = Object.keys(donationStatuses);

    const [selectedStatus, setSelectedStatus] = useState<DonationStatusValues>(initialStatus);

    async function fetchDonation(id: string) {
        setIsLoading(true);
        try {
            const donationToView = await getDonationById(id);
            setDonationDetails(donationToView);
            setIsLoading(false);
        } catch (error: any) {
            addErrorEvent(`Fetch donation by ID`, error);
            setIsLoading(false);
        }
    }

    const selectHandler = (event: SelectChangeEvent) => setSelectedStatus(event.target.value);

    useEffect(() => {
        fetchDonation(params.id);
    }, []);

    useEffect(() => {
        setSelectedStatus(initialStatus);
    }, [initialStatus]);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                {isEditMode ? <h1>Donation Details</h1> : <h1>Edit Donation</h1>}
                {isLoading && <Loader />}
                {!isLoading && donationDetails === null && <p>Donation not found</p>}
                {!isLoading && donationDetails !== null && !isEditMode && (
                    <div className="content--container">
                        <h2>{donationDetails.brand}</h2>
                        <h3>{donationDetails.model}</h3>
                        <p>{donationDetails.description}</p>
                        {donationDetails.status && (
                            <FormControl fullWidth>
                                <InputLabel id="donation-status-label">Status</InputLabel>
                                <Select labelId="donation-status-label" id="donation-status" value={selectedStatus} label="Status" onChange={selectHandler}>
                                    {statusSelectOptions.map((status) => {
                                        const value = donationStatuses[status as keyof DonationStatuses];
                                        return (
                                            <MenuItem key={status} value={value}>
                                                {status}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        )}
                    </div>
                )}
            </div>
        </ProtectedAdminRoute>
    );
}
