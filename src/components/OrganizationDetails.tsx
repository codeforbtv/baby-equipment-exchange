'use client';
//Hooks
import { useEffect, useState, Dispatch, SetStateAction } from 'react';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Loader from '@/components/Loader';
import EditOrganization from '@/components/EditOrganization';
import { Button, IconButton } from '@mui/material';
//Api
import { getOrganizationById } from '@/api/firebase-organizations';
import { addErrorEvent } from '@/api/firebase';
//icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
                        <Button type="button" variant="contained" onClick={() => setIsEditMode(true)}>
                            Edit Organization
                        </Button>
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
