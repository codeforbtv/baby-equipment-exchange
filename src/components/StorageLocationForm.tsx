'use client';

//Hooks
import { Dispatch, SetStateAction, useState } from 'react';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
import CustomDialog from './CustomDialog';
import Loader from './Loader';
//API
import { addStorage } from '@/api/firebase-storage';
import { addErrorEvent } from '@/api/firebase';
import { PatternFormat } from 'react-number-format';
//Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//Types
import { StorageBody } from '@/types/post-data';

type StorageLocationFormProps = {
    setShowForm?: Dispatch<SetStateAction<boolean>>;
    setStorageUpdated?: Dispatch<SetStateAction<boolean>>;
};

const StorageLocationForm = (props: StorageLocationFormProps) => {
    const { setShowForm, setStorageUpdated } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [line1, setLine1] = useState<string>('');
    const [line2, setLine2] = useState<string>('');
    const [city, setCity] = useState<string>('');
    const [state, setState] = useState<string>('');
    const [zipcode, setZipcode] = useState<string>('');
    const [contactName, setContactName] = useState<string>('');
    const [contactEmail, setContactEmail] = useState<string>('');
    const [contactPhone, setContactPhone] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleClose = () => {
        if (setStorageUpdated) setStorageUpdated(true);
        if (setShowForm) {
            setIsDialogOpen(false);
            setShowForm(false);
        } else {
            setIsDialogOpen(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);
        try {
            const storageToCreate: StorageBody = {
                active: true,
                name: name,
                address: {
                    line_1: line1 || null,
                    line_2: line2 || null,
                    city: city || null,
                    state: state || null,
                    zipcode: zipcode || null
                },
                pointOfContact: {
                    user: null,
                    name: contactName || null,
                    email: contactEmail || null,
                    phone: contactPhone || null,
                    website: null,
                    notes: null
                }
            };
            await addStorage(storageToCreate);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error creating storage location: ', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <Typography variant="h5">Create Storage Location</Typography>
                {setShowForm && (
                    <IconButton onClick={() => setShowForm(false)}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
            </div>

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
                            id="storage-name"
                            placeholder="Storage location name"
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
                            id="storage-line1"
                            placeholder="Street address"
                            onChange={(e) => setLine1(e.target.value)}
                            value={line1}
                        />
                        <TextField
                            type="text"
                            label="Address Line 2"
                            name="line2"
                            id="storage-line2"
                            placeholder="Suite, unit, etc."
                            onChange={(e) => setLine2(e.target.value)}
                            value={line2}
                        />
                        <Box display="flex" gap={2}>
                            <TextField
                                type="text"
                                label="City"
                                name="city"
                                id="storage-city"
                                onChange={(e) => setCity(e.target.value)}
                                value={city}
                                sx={{ flex: 2 }}
                            />
                            <TextField
                                type="text"
                                label="State"
                                name="state"
                                id="storage-state"
                                onChange={(e) => setState(e.target.value)}
                                value={state}
                                sx={{ flex: 1 }}
                            />
                            <TextField
                                type="text"
                                label="Zipcode"
                                name="zipcode"
                                id="storage-zipcode"
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
                            id="storage-contact-name"
                            onChange={(e) => setContactName(e.target.value)}
                            value={contactName}
                        />
                        <TextField
                            type="email"
                            label="Contact Email"
                            name="contactEmail"
                            id="storage-contact-email"
                            onChange={(e) => setContactEmail(e.target.value)}
                            value={contactEmail}
                        />
                        <PatternFormat
                            id="phone-number"
                            format="+1 (###) ###-####"
                            mask="_"
                            allowEmptyFormatting
                            value={contactPhone}
                            onValueChange={(values) => setContactPhone(values.formattedValue)}
                            type="tel"
                            displayType="input"
                            customInput={TextField}
                            required
                            error={contactPhone.includes('_')}
                        />

                        <Button variant="contained" type="submit" disabled={name.length === 0}>
                            Create Storage Location
                        </Button>
                        {setShowForm && (
                            <Button variant="outlined" type="button" onClick={() => setShowForm(false)}>
                                Cancel
                            </Button>
                        )}
                    </Box>
                    <CustomDialog
                        isOpen={isDialogOpen}
                        onClose={handleClose}
                        title="Storage location created"
                        content={`The storage location "${name}" has been successfully created.`}
                    />
                </div>
            )}
        </ProtectedAdminRoute>
    );
};

export default StorageLocationForm;
