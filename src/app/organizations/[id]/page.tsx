'use client';
//Hooks
import { useEffect, useState } from 'react';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Loader from '@/components/Loader';
import EditOrganization from '@/components/EditOrganization';
import { Button } from '@mui/material';
//Api
import { getOrganizationById } from '@/api/firebase-organizations';
import { addErrorEvent } from '@/api/firebase';
//Styling
import '@/styles/globalStyles.css';
//Types
import { IOrganization } from '@/models/organization';

const OrganizationDetails = ({ params }: { params: { id: string } }) => {
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
        fetchOrganizationById(params.id);
    }, []);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                {!isEditMode ? <h1>Organization Details</h1> : <h1>Edit Organization</h1>}
                {isLoading && <Loader />}
                {!isLoading && !organizationDetails && <p>Organization not found</p>}
                {!isLoading && organizationDetails && !isEditMode && (
                    <div className="content--container">
                        <h3>{organizationDetails.name}</h3>
                        {organizationDetails.address && (
                            <div className="address">
                                <p>{organizationDetails.address.line_1}</p>
                                <p>{organizationDetails.address.line_2}</p>
                                <p>{organizationDetails.address.city}</p> <p>{organizationDetails.address.state}</p>
                                <p>{organizationDetails.address.zipcode}</p>
                            </div>
                        )}
                        {organizationDetails.county && <p>{organizationDetails.county} County</p>}
                        {organizationDetails.phoneNumber && <p>{organizationDetails.phoneNumber}</p>}
                        <p>
                            <b>Tags:</b>
                        </p>
                        <ul>
                            {organizationDetails.tags.map((tag) => (
                                <li key={tag}>{tag}</li>
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
                    <EditOrganization organizationDetails={organizationDetails} setIsEditMode={setIsEditMode} fetchDonationDetails={fetchOrganizationById} />
                )}
            </div>
        </ProtectedAdminRoute>
    );
};

export default OrganizationDetails;
