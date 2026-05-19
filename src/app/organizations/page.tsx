'use client';

//Hooks
import { useState, useEffect } from 'react';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Loader from '@/components/Loader';
import Organizations from '@/components/Organizations';
//API
import { addErrorEvent } from '@/api/firebase';
import { getOrganizationNames } from '@/app/actions/firebase';
//Styles
import '@/styles/globalStyles.css';

const OrganizationsPage = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [orgNamesAndIds, setOrgNamesAndIds] = useState<{
        [key: string]: string;
    } | null>(null);

    const fetchOrgNames = async (): Promise<void> => {
        setIsLoading(true);
        try {
            const orgNamesResult = await getOrganizationNames();
            setOrgNamesAndIds(orgNamesResult);
            setIsLoading(false);
        } catch (error) {
            addErrorEvent('Could not fetch org names', error);
            setIsLoading(false);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchOrgNames();
    }, []);

    return (
        <ProtectedAdminRoute>
            <>
                {isLoading && <Loader />}
                {!isLoading && !orgNamesAndIds && <p>No organizations found</p>}
                {!isLoading && orgNamesAndIds && (
                    <Organizations orgNamesAndIds={orgNamesAndIds} />
                )}
            </>
        </ProtectedAdminRoute>
    );
};

export default OrganizationsPage;
