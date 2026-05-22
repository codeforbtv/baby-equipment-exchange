'use client';

//Hooks
import { useState, Dispatch, SetStateAction } from 'react';

//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import OrganizationDetails from '@/components/OrganizationDetails';
import OrganizationForm from '@/components/OrganizationForm';
//Styles
import '@/styles/globalStyles.css';
import { Button, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
//Types
type OrganizationsProps = {
    orgNamesAndIds: { [key: string]: string };
    setOrgsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const Organizations = (props: OrganizationsProps) => {
    const { orgNamesAndIds, setOrgsUpdated } = props;
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
                        <Typography variant="h5">Organizations</Typography>
                    </div>
                    <Button variant="contained" type="button" onClick={handleShowForm}>
                        Create new
                    </Button>

                    <div className="content--container">
                        {orgNamesAndIds && (
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
