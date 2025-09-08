'use client';

//Hooks
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
//API
import { addErrorEvent, callGetOrganizationNames } from '@/api/firebase';
//Styles
import '@/styles/globalStyles.css';
import Loader from '@/components/Loader';
import { Card, CardContent, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

const Organizations = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    //List of Org names, ids from Server
    const [orgNamesAndIds, setOrgNamesAndIds] = useState<{
        [key: string]: string;
    }>({});

    const orgNames = Object.keys(orgNamesAndIds);

    const getOrgNames = async (): Promise<void> => {
        setIsLoading(true);
        try {
            const organizationNames = await callGetOrganizationNames();
            setOrgNamesAndIds(organizationNames);
        } catch (error) {
            addErrorEvent('Could not fetch org names', error);
            setIsLoading(false);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getOrgNames();
    }, []);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <h1>Organizations</h1>
                <div className="content--container">
                    {isLoading && <Loader />}
                    {!isLoading && orgNamesAndIds && (
                        <List>
                            {orgNames.map((org) => (
                                <ListItem>
                                    <ListItemButton component="a" href={`/organizations/${orgNamesAndIds[org]}`}>
                                        <ListItemText primary={org} sx={{ color: 'black' }} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </div>
            </div>
        </ProtectedAdminRoute>
    );
};

export default Organizations;
