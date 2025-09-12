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
import OrganizationDetails from '@/components/OrganizationDetails';

type OrganizationsProps = {
    orgNamesAndIds: { [key: string]: string };
};

const Organizations = (props: OrganizationsProps) => {
    const { orgNamesAndIds } = props;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);

    const orgNames = Object.keys(orgNamesAndIds);

    return (
        <ProtectedAdminRoute>
            {idToDisplay ? (
                <OrganizationDetails id={idToDisplay} setIdToDisplay={setIdToDisplay} />
            ) : (
                <div className="page--header">
                    <h1>Organizations</h1>
                    <div className="content--container">
                        {isLoading && <Loader />}
                        {!isLoading && orgNamesAndIds && (
                            <List>
                                {orgNames.map((org) => (
                                    <ListItem key={org}>
                                        <ListItemButton component="a" onClick={() => setIdToDisplay(orgNamesAndIds[org])}>
                                            <ListItemText primary={org} sx={{ color: 'black' }} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </div>
                </div>
            )}
        </ProtectedAdminRoute>
    );
};

export default Organizations;
