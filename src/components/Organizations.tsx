'use client';

//Hooks
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
//API
import { addErrorEvent, callGetOrganizationNames } from '@/api/firebase';
//Styles
import '@/styles/globalStyles.css';
import Loader from '@/components/Loader';
import { Button, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import OrganizationDetails from '@/components/OrganizationDetails';
import OrganizationForm from '@/components/OrganizationForm';

type OrganizationsProps = {
    orgNamesAndIds: { [key: string]: string };
    setOrgsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const Organizations = (props: OrganizationsProps) => {
    const { orgNamesAndIds, setOrgsUpdated } = props;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);

    const orgNames = Object.keys(orgNamesAndIds);

    const handleShowForm = () => {
        //Close details if open
        setIdToDisplay(null);
        setShowForm(true);
    };

    return (
        <ProtectedAdminRoute>
            {idToDisplay && <OrganizationDetails id={idToDisplay} setIdToDisplay={setIdToDisplay} setOrgsUpdated={setOrgsUpdated} />}
            {showForm && <OrganizationForm setShowForm={setShowForm} setOrgsUpdated={setOrgsUpdated} />}
            {!idToDisplay && !showForm && (
                <>
                    <div className="page--header">
                        <h3>Organizations</h3>
                    </div>
                    <Button variant="contained" type="button" onClick={handleShowForm}>
                        Create new
                    </Button>
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
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default Organizations;
