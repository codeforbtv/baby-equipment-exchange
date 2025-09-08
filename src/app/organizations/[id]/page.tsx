'use client';
//Hooks
import { useEffect, useState } from 'react';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Loader from '@/components/Loader';
//Api
import { getOrganizationById } from '@/api/firebase-organizations';
//Styling
import '@/styles/globalStyles.css';
import { IOrganization } from '@/models/organization';
import { addErrorEvent } from '@/api/firebase';

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

    useEffect(() => {
        console.log(organizationDetails);
    }, [organizationDetails]);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                {!isEditMode ? <h1>Organization Details</h1> : <h1>Edit Organization</h1>}
                {isLoading && <Loader />}
            </div>
        </ProtectedAdminRoute>
    );
};

export default OrganizationDetails;
