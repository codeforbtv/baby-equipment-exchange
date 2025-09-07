'use client';

//Hooks
import { MouseEventHandler, SyntheticEvent, useEffect, useState } from 'react';
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

import { Dialog, DialogActions, FormControl, ImageList, ImageListItem, InputLabel, MenuItem, Select, SelectChangeEvent, Button } from '@mui/material';

export default function DonationDetails({ params }: { params: { id: string } }) {
    const [donationDetails, setDonationDetails] = useState<IDonation | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isImageOpen, setIsImageOpen] = useState<boolean>(false);
    const [openImageURL, setOpenImageURL] = useState<string>('');

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

    const handleImageClick: MouseEventHandler<HTMLImageElement> = (event) => {
        setOpenImageURL(event.currentTarget.src);
        setIsImageOpen(true);
    };

    const handleImageClose = () => setIsImageOpen(false);

    useEffect(() => {
        fetchDonation(params.id);
    }, []);

    useEffect(() => {
        setSelectedStatus(initialStatus);
    }, [initialStatus]);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                {!isEditMode ? <h1>Donation Details</h1> : <h1>Edit Donation</h1>}
                {isLoading && <Loader />}
                {!isLoading && donationDetails === null && <p>Donation not found</p>}
                {!isLoading && donationDetails !== null && !isEditMode && (
                    <div className="content--container">
                        <ImageList>
                            {donationDetails.images.map((image) => (
                                <ImageListItem key={image as string}>
                                    <img src={`${image}`} alt={donationDetails.model} loading="lazy" onClick={handleImageClick} />
                                </ImageListItem>
                            ))}
                        </ImageList>
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
                        <h2>
                            <b>Brand: </b>
                            {donationDetails.brand}
                        </h2>
                        <h3>
                            <b>Model: </b>
                            {donationDetails.model}
                        </h3>
                        <p>
                            <b>Description: </b>
                            {donationDetails.description}
                        </p>

                        <p>
                            <b>Donated by: </b>
                            {donationDetails.donorEmail}
                        </p>
                        {donationDetails.requestor && (
                            <p>
                                <b>Requested by:</b>
                                {donationDetails.requestor.name}
                            </p>
                        )}
                        {donationDetails.dateReceived && (
                            <p>
                                <b>Date recieved: </b>
                                {donationDetails.dateReceived.toDate().toDateString()}
                            </p>
                        )}
                        {donationDetails.dateDistributed && (
                            <p>
                                <b>Date distributed: </b>
                                {donationDetails.dateDistributed.toDate().toDateString()}
                            </p>
                        )}
                        <Dialog open={isImageOpen} onClose={handleImageClose} sx={{ width: '100%' }}>
                            <img src={openImageURL} alt={openImageURL} style={{ maxWidth: '100%' }} />
                            <DialogActions>
                                <Button type="button" onClick={handleImageClose}>
                                    Close
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </div>
                )}
            </div>
        </ProtectedAdminRoute>
    );
}
