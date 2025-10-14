'use client';
//Hooks
import { useEffect, useState, Dispatch, SetStateAction } from 'react';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Loader from '@/components/Loader';
import EditOrganization from '@/components/EditOrganization';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material';
import CustomDialog from './CustomDialog';
//Api
import { getOrganizationById, deleteOrganization } from '@/api/firebase-organizations';
import { addErrorEvent } from '@/api/firebase';
//icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
//Styles
//Styling
import '@/styles/globalStyles.css';
//Types
import { orgTags, OrganizationTagKeys, IOrganization } from '@/models/organization';

type OrganizationDetailsProps = {
    id: string;
    setIdToDisplay?: Dispatch<SetStateAction<string | null>>;
    setOrgsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const tagNames: OrganizationTagKeys[] = Object.keys(orgTags) as OrganizationTagKeys[];

const OrganizationDetails = (props: OrganizationDetailsProps) => {
    const { id, setIdToDisplay, setOrgsUpdated } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [organizationDetails, setOrganizationDetails] = useState<IOrganization | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleDeleteOrganization = async (id: string): Promise<void> => {
        setShowDeleteDialog(false);
        setIsLoading(true);
        try {
            await deleteOrganization(id);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error deleting organization', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (setIdToDisplay) setIdToDisplay(null);
        if (setOrgsUpdated) setOrgsUpdated(true);
        setIsDialogOpen(false);
    };

    const fetchOrganizationById = async (id: string): Promise<void> => {
        setIsLoading(true);
        try {
            const organizationResult = await getOrganizationById(id);
            setOrganizationDetails(organizationResult);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Fetch organization by id', error);
        }
    };

    useEffect(() => {
        fetchOrganizationById(id);
    }, []);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                {!isEditMode ? <h3>Organization Details</h3> : <h3>Edit Organization</h3>}
                {setIdToDisplay && (
                    <IconButton onClick={() => setIdToDisplay(null)}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
                {isLoading && <Loader />}
                {!isLoading && !organizationDetails && <p>Organization not found</p>}
                {!isLoading && organizationDetails && !isEditMode && (
                    <div className="content--container">
                        <h3>{organizationDetails.name}</h3>
                        {organizationDetails.address && (
                            <div className="address">
                                <p>{organizationDetails.address.line_1}</p>
                                <p>{organizationDetails.address.line_2}</p>
                                <p>
                                    {organizationDetails.address.city} {organizationDetails.address.state} {organizationDetails.address.zipcode}
                                </p>
                            </div>
                        )}
                        {organizationDetails.county && (
                            <p>
                                <b>County: </b>
                                {organizationDetails.county}
                            </p>
                        )}
                        {organizationDetails.phoneNumber && (
                            <p>
                                <b>Phone: </b>
                                {organizationDetails.phoneNumber}
                            </p>
                        )}
                        <p>
                            <b>Tags:</b>
                        </p>

                        <ul>
                            {organizationDetails.tags.map((tag) => (
                                <li key={tag}>{tagNames.find((tagname) => orgTags[tagname] === tag)}</li>
                            ))}
                        </ul>

                        {organizationDetails.notes.length > 0 && (
                            <>
                                <p>
                                    <b>Notes:</b>
                                </p>
                                <ul>
                                    {organizationDetails.notes.map((note, i) => (
                                        <li key={i}>{note}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                        <Box display="flex" gap={2}>
                            <Button type="button" variant="contained" onClick={() => setIsEditMode(true)}>
                                Edit Organization
                            </Button>
                            <Button type="button" variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => setShowDeleteDialog(true)}>
                                Delete Organiztion
                            </Button>
                        </Box>
                        <Dialog open={showDeleteDialog} aria-labelledby="dialog-title" aria-describedby="dialog-description">
                            <DialogTitle id="dialog-title">Delete Organization</DialogTitle>
                            <DialogContent>
                                <DialogContentText>This will permanently delete the organization {organizationDetails.name}. Are you sure?</DialogContentText>
                                <DialogActions>
                                    <Button variant="contained" onClick={() => handleDeleteOrganization(organizationDetails.id)}>
                                        Confirm
                                    </Button>
                                    <Button variant="outlined" onClick={() => setShowDeleteDialog(false)}>
                                        Cancel
                                    </Button>
                                </DialogActions>
                            </DialogContent>
                        </Dialog>
                        {/* delete confirmation dialog */}
                        <CustomDialog
                            isOpen={isDialogOpen}
                            onClose={handleClose}
                            title={'Organization deleted.'}
                            content={`${organizationDetails.name} has been deleted.`}
                        />
                    </div>
                )}
                {!isLoading && organizationDetails && isEditMode && (
                    <EditOrganization
                        organizationDetails={organizationDetails}
                        setIsEditMode={setIsEditMode}
                        fetchDonationDetails={fetchOrganizationById}
                        setOrgsUpdated={setOrgsUpdated}
                    />
                )}
            </div>
        </ProtectedAdminRoute>
    );
};

export default OrganizationDetails;
