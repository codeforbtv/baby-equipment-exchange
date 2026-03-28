'use client';

//Hooks
import { Dispatch, SetStateAction, useState } from 'react';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Box, Button, TextField, Typography } from '@mui/material';
import CustomDialog from './CustomDialog';
import Loader from './Loader';
//API
import { updateStorage } from '@/api/firebase-storage';
import { addErrorEvent } from '@/api/firebase';
//Types
import { Storage } from '@/models/storage';

type EditStorageLocationProps = {
    storageLocation: Storage;
    setIsEditMode: Dispatch<SetStateAction<boolean>>;
    setDetailsUpdated: Dispatch<SetStateAction<boolean>>;
    setStorageUpdated?: Dispatch<SetStateAction<boolean>>;
};

const EditStorageLocation = (props: EditStorageLocationProps) => {
    const { storageLocation, setIsEditMode, setDetailsUpdated, setStorageUpdated } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [name, setName] = useState<string>(storageLocation.name);
    const [line1, setLine1] = useState<string>(storageLocation.address?.line_1 ?? '');
    const [line2, setLine2] = useState<string>(storageLocation.address?.line_2 ?? '');
    const [city, setCity] = useState<string>(storageLocation.address?.city ?? '');
    const [state, setState] = useState<string>(storageLocation.address?.state ?? '');
    const [zipcode, setZipcode] = useState<string>(storageLocation.address?.zipcode ?? '');
    const [contactName, setContactName] = useState<string>(storageLocation.pointOfContact?.name ?? '');
    const [contactEmail, setContactEmail] = useState<string>(storageLocation.pointOfContact?.email ?? '');
    const [contactPhone, setContactPhone] = useState<string>(storageLocation.pointOfContact?.phone ?? '');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleClose = () => {
        setIsDialogOpen(false);
        setDetailsUpdated(true);
        if (setStorageUpdated) setStorageUpdated(true);
        setIsEditMode(false);
    };

    const handleSubmit = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);
        try {
            await updateStorage(storageLocation.id, {
                name: name,
                address: {
                    line_1: line1 || null,
                    line_2: line2 || null,
                    city: city || null,
                    state: state || null,
                    zipcode: zipcode || null
                },
                pointOfContact: {
                    user: storageLocation.pointOfContact?.user ?? null,
                    name: contactName || null,
                    email: contactEmail || null,
                    phone: contactPhone || null,
                    website: storageLocation.pointOfContact?.website ?? null,
                    notes: storageLocation.pointOfContact?.notes ?? null
                }
            });
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error updating storage location: ', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProtectedAdminRoute>
            {isLoading && <Loader />}
            {!isLoading && (
                <div className="content--container">
                    <Box component="form" display={'flex'} flexDirection={'column'} gap={3} className="form--container" onSubmit={handleSubmit}>
                        <Typography variant="h6" sx={{ mt: 1 }}>
                            Location Info
                        </Typography>
                        <TextField
                            type="text"
                            label="Name"
                            name="name"
                            id="edit-storage-name"
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            required
                        />

                        <Typography variant="h6" sx={{ mt: 1 }}>
                            Address
                        </Typography>
                        <TextField
                            type="text"
                            label="Address Line 1"
                            name="line1"
                            id="edit-storage-line1"
                            onChange={(e) => setLine1(e.target.value)}
                            value={line1}
                        />
                        <TextField
                            type="text"
                            label="Address Line 2"
                            name="line2"
                            id="edit-storage-line2"
                            onChange={(e) => setLine2(e.target.value)}
                            value={line2}
                        />
                        <Box display="flex" gap={2}>
                            <TextField
                                type="text"
                                label="City"
                                name="city"
                                id="edit-storage-city"
                                onChange={(e) => setCity(e.target.value)}
                                value={city}
                                sx={{ flex: 2 }}
                            />
                            <TextField
                                type="text"
                                label="State"
                                name="state"
                                id="edit-storage-state"
                                onChange={(e) => setState(e.target.value)}
                                value={state}
                                sx={{ flex: 1 }}
                            />
                            <TextField
                                type="text"
                                label="Zipcode"
                                name="zipcode"
                                id="edit-storage-zipcode"
                                onChange={(e) => setZipcode(e.target.value)}
                                value={zipcode}
                                sx={{ flex: 1 }}
                            />
                        </Box>

                        <Typography variant="h6" sx={{ mt: 1 }}>
                            Point of Contact
                        </Typography>
                        <TextField
                            type="text"
                            label="Contact Name"
                            name="contactName"
                            id="edit-storage-contact-name"
                            onChange={(e) => setContactName(e.target.value)}
                            value={contactName}
                        />
                        <TextField
                            type="email"
                            label="Contact Email"
                            name="contactEmail"
                            id="edit-storage-contact-email"
                            onChange={(e) => setContactEmail(e.target.value)}
                            value={contactEmail}
                        />
                        <TextField
                            type="tel"
                            label="Contact Phone"
                            name="contactPhone"
                            id="edit-storage-contact-phone"
                            onChange={(e) => setContactPhone(e.target.value)}
                            value={contactPhone}
                        />

                        <Button variant="contained" type="submit" disabled={name.length === 0}>
                            Save Changes
                        </Button>
                        <Button variant="outlined" type="button" onClick={() => setIsEditMode(false)}>
                            Cancel
                        </Button>
                    </Box>
                    <CustomDialog
                        isOpen={isDialogOpen}
                        onClose={handleClose}
                        title="Storage location updated"
                        content={`The storage location "${name}" has been successfully updated.`}
                    />
                </div>
            )}
        </ProtectedAdminRoute>
    );
};

export default EditStorageLocation;
