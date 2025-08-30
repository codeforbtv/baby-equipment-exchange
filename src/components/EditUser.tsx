'use client';

//Hooks
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
//API
import { callGetOrganizationNames, addErrorEvent, callIsEmailInUse } from '@/api/firebase';
//Componenets
import { Paper, Box, FormControl, InputLabel, Select, SelectChangeEvent, MenuItem } from '@mui/material';
import Loader from '@/components/Loader';
//Styles
import '@/styles/globalStyles.css';
//Types
import { UserDetails } from '@/types/UserTypes';

const EditUser = (props: UserDetails) => {
    const { email, displayName, metadata, customClaims, phoneNumber, notes, organization } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [newDisplayName, setNewDisplayName] = useState<string>(displayName);
    const [newEmail, setNewEmail] = useState<string>(email);
    const [selectedOrg, setSelectedOrg] = useState<string>('');
    const [isEmailInUse, setIsEmailInUse] = useState<boolean>(false);
    const [isInvalidEmail, setIsInvalidEmail] = useState<boolean>(false);
    const [newPhoneNumber, setNewPhoneNumber] = useState<string>(phoneNumber);
    const [openDialog, setOpenDialog] = useState<boolean>(false);

    //List of Org names, ids from Server
    const [orgNamesAndIds, setOrgNamesAndIds] = useState<{
        [key: string]: string;
    } | null>(null);

    const getOrgNames = async (): Promise<void> => {
        try {
            setIsLoading(true);
            const organizationNamesResult = await callGetOrganizationNames();
            setOrgNamesAndIds(organizationNamesResult);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Could not fetch org names', error);
        }
    };

    const handleOrgSelect = (event: SelectChangeEvent) => {
        setSelectedOrg(event.target.value);
    };

    useEffect(() => {
        getOrgNames();
    }, []);

    useEffect(() => {
        if (organization) {
            setSelectedOrg(organization.name);
        }
    }, [organization]);

    useEffect(() => {
        console.log(selectedOrg);
    }, [selectedOrg]);

    return (
        <>
            <Paper className="content--container" elevation={8} square={false}>
                {isLoading ? (
                    <Loader />
                ) : (
                    <Box component="form" className="form--container">
                        {orgNamesAndIds ? (
                            <FormControl fullWidth>
                                <InputLabel id="organization-select-label">
                                    Organization
                                    <Select
                                        sx={{ width: 'fit-content' }}
                                        labelId="organization-select-label"
                                        id="organization-select"
                                        value={selectedOrg}
                                        label="Organization"
                                        onChange={handleOrgSelect}
                                    >
                                        {Object.keys(orgNamesAndIds).map((orgName) => (
                                            <MenuItem key={orgName} value={orgName}>
                                                {orgName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </InputLabel>
                            </FormControl>
                        ) : (
                            <p>Could not load list of organizations</p>
                        )}
                    </Box>
                )}
            </Paper>
        </>
    );
};

export default EditUser;
