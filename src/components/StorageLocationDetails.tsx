'use client';

//Hooks
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Button, IconButton, Stack, Typography } from '@mui/material';
import Loader from './Loader';
import EditStorageLocation from './EditStorageLocation';
//Api
import { updateStorage, getStorageById } from '@/api/firebase-storage';
import { addErrorEvent } from '@/api/firebase';
//Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PlaceIcon from '@mui/icons-material/Place';
//Styles
import '@/styles/globalStyles.css';
//Types
import { Storage } from '@/models/storage';

type StorageLocationDetailsProps = {
    id: string;
    storageLocation?: Storage;
    setIdToDisplay?: Dispatch<SetStateAction<string | null>>;
    setStorageUpdated?: Dispatch<SetStateAction<boolean>>;
};

const StorageLocationDetails = (props: StorageLocationDetailsProps) => {
    const { id, storageLocation, setIdToDisplay, setStorageUpdated } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [detailsUpdated, setDetailsUpdated] = useState<boolean>(false);
    const [details, setDetails] = useState<Storage | undefined>(storageLocation);

    const fetchStorageLocation = async (id: string): Promise<void> => {
        setIsLoading(true);
        try {
            const result = await getStorageById(id);
            setDetails(result);
            setDetailsUpdated(false);
        } catch (error) {
            addErrorEvent('Error fetching storage location: ', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleActive = async (): Promise<void> => {
        setIsLoading(true);
        try {
            await updateStorage(id, { active: !details?.active });
            setDetailsUpdated(true);
            if (setStorageUpdated) setStorageUpdated(true);
        } catch (error) {
            addErrorEvent('Error toggling storage active status: ', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!details || detailsUpdated) fetchStorageLocation(id);
    }, [detailsUpdated]);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                {!isEditMode ? (
                    <Typography variant="h5">Storage Location Details</Typography>
                ) : (
                    <Typography variant="h5">Edit Storage Location</Typography>
                )}
                {setIdToDisplay && (
                    <IconButton onClick={() => setIdToDisplay(null)}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
            </div>

            {isLoading && <Loader />}
            {!isLoading && !details && !isEditMode && <Typography variant="body1">Storage location not found</Typography>}
            {!isLoading && details && !isEditMode && (
                <div className="content--container">
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <PlaceIcon sx={{ color: details.active ? '#1976d2' : '#bdbdbd' }} />
                        <Typography variant="h5">{details.name}</Typography>
                    </Stack>

                    <Typography variant="caption">Status</Typography>
                    {details.active ? (
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="h6">Active</Typography>
                            <Button variant="text" onClick={handleToggleActive}>
                                Make inactive
                            </Button>
                        </Stack>
                    ) : (
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="h6">Inactive</Typography>
                            <Button variant="text" onClick={handleToggleActive}>
                                Make Active
                            </Button>
                        </Stack>
                    )}

                    {details.address && (
                        <>
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                <b>Address</b>
                            </Typography>
                            {details.address.line_1 && <Typography variant="body1">{details.address.line_1}</Typography>}
                            {details.address.line_2 && <Typography variant="body1">{details.address.line_2}</Typography>}
                            <Typography variant="body1">
                                {[details.address.city, details.address.state, details.address.zipcode].filter(Boolean).join(', ')}
                            </Typography>
                        </>
                    )}

                    {details.pointOfContact && (
                        <>
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                <b>Point of Contact</b>
                            </Typography>
                            {details.pointOfContact.name && (
                                <Typography variant="body1">{details.pointOfContact.name}</Typography>
                            )}
                            {details.pointOfContact.email && (
                                <Typography variant="body1">{details.pointOfContact.email}</Typography>
                            )}
                            {details.pointOfContact.phone && (
                                <Typography variant="body1">{details.pointOfContact.phone}</Typography>
                            )}
                        </>
                    )}

                    <Stack sx={{ marginTop: '2em' }}>
                        <Button variant="contained" type="button" startIcon={<EditIcon />} onClick={() => setIsEditMode(true)}>
                            Edit Storage Location
                        </Button>
                    </Stack>
                </div>
            )}
            {!isLoading && details && isEditMode && (
                <EditStorageLocation
                    storageLocation={details}
                    setIsEditMode={setIsEditMode}
                    setDetailsUpdated={setDetailsUpdated}
                    setStorageUpdated={setStorageUpdated}
                />
            )}
        </ProtectedAdminRoute>
    );
};

export default StorageLocationDetails;
