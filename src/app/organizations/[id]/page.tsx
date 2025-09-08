'use client';
//Hooks
import { useState } from 'react';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Loader from '@/components/Loader';
//Api
//Styling
import '@/styles/globalStyles.css';

const OrganizationDetails = ({ params }: { params: { id: string } }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);

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
