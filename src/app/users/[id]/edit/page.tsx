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
import '../../../../styles/globalStyles.css';
//Types
import { UserDetails } from '@/types/UserTypes';

const EditUser = (props: UserDetails) => {
    const { email, displayName, metadata, customClaims, phoneNumber, notes, organization } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [newDisplayName, setNewDisplayName] = useState<string>(displayName);
    const [newEmail, setNewEmail] = useState<string>(email);
    const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string } | null>(organization);
    const [isEmailInUse, setIsEmailInUse] = useState<boolean>(false);
    const [isInvalidEmail, setIsInvalidEmail] = useState<boolean>(false);
    const [newPhoneNumber, setNewPhoneNumber] = useState<string>(phoneNumber);
    const [openDialog, setOpenDialog] = useState<boolean>(false);

    //List of Org names, ids from Server
    const [orgNamesAndIds, setOrgNamesAndIds] = useState<{
        [key: string]: string;
    }>({});

    const orgNames = Object.keys(orgNamesAndIds);
    const selectedOrgName = selectedOrg?.name;
    const router = useRouter();

    const getOrgNames = async (): Promise<void> => {
        try {
            const organizationNames = await callGetOrganizationNames();
            setOrgNamesAndIds(organizationNames);
        } catch (error) {
            addErrorEvent('Could not fetch org names', error);
        }
    };

    const handleOrgSelect = (event: SelectChangeEvent) => {
        setSelectedOrg({
            id: orgNamesAndIds[event.target.value],
            name: event.target.value
        });
    };

    useEffect(() => {
        getOrgNames();
    }, []);

    useEffect(() => {
        console.log(selectedOrg);
    }, [selectedOrg]);

    return (
        <>
            <div className="page--header">
                <h1>Edit User</h1>
            </div>

            <Paper className="content--container" elevation={8} square={false}>
                {isLoading ? (
                    <Loader />
                ) : (
                    <Box component="form" className="form--container">
                        <FormControl>
                            <InputLabel id="organization-select-label">
                                Organization
                                <Select
                                    labelId="organization-select-label"
                                    id="organization-select"
                                    value={selectedOrgName}
                                    label="Organization"
                                    onChange={handleOrgSelect}
                                >
                                    {orgNames.map((orgName) => (
                                        <MenuItem value={orgName}>{orgName}</MenuItem>
                                    ))}
                                </Select>
                            </InputLabel>
                        </FormControl>
                    </Box>
                )}
            </Paper>
        </>
    );
};

export default EditUser;
