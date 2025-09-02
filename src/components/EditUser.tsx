'use client';

//Hooks
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

//API
import { callGetOrganizationNames, addErrorEvent, callIsEmailInUse } from '@/api/firebase';
import { PatternFormat, OnValueChange } from 'react-number-format';
//Componenets
import { Paper, Box, FormControl, InputLabel, Select, SelectChangeEvent, MenuItem, Autocomplete, TextField } from '@mui/material';
import Loader from '@/components/Loader';
//Styles
import '@/styles/globalStyles.css';
//Types
import { UserDetails } from '@/types/UserTypes';

const EditUser = (props: UserDetails) => {
    const { email, displayName, metadata, customClaims, phoneNumber, notes, organization } = props;

    console.log(props);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [newDisplayName, setNewDisplayName] = useState<string>(displayName);
    const [newEmail, setNewEmail] = useState<string>(email);

    const [isEmailInUse, setIsEmailInUse] = useState<boolean>(false);
    const [isInvalidEmail, setIsInvalidEmail] = useState<boolean>(false);
    const [newPhoneNumber, setNewPhoneNumber] = useState<string>(phoneNumber);
    const [openDialog, setOpenDialog] = useState<boolean>(false);

    //List of Org names, ids from Server
    const [orgNamesAndIds, setOrgNamesAndIds] = useState<{
        [key: string]: string;
    }>({});

    const orgNames = Object.keys(orgNamesAndIds);

    const initialOrg: string | null = organization ? organization.name : null;

    const [selectedOrg, setSelectedOrg] = useState<string | null>(initialOrg);

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

    const handlePhoneNumberInput: OnValueChange = (values): void => {
        setNewPhoneNumber(values.formattedValue);
    };

    useEffect(() => {
        getOrgNames();
    }, []);

    return (
        <>
            <Paper className="content--container" elevation={8} square={false}>
                {isLoading ? (
                    <Loader />
                ) : (
                    <Box component="form" className="form--container">
                        {orgNamesAndIds ? (
                            <Autocomplete
                                disablePortal
                                sx={{ maxWidth: '580px' }}
                                value={selectedOrg}
                                onChange={(event: any, newValue: string | null) => setSelectedOrg(newValue)}
                                id="organzation-select"
                                options={orgNames}
                                renderInput={(params) => <TextField {...params} label="Organization" />}
                            />
                        ) : (
                            <p>Could not load list of organizations</p>
                        )}
                        <PatternFormat
                            id="phone-number"
                            format="+1 (###) ###-####"
                            mask="_"
                            allowEmptyFormatting
                            value={newPhoneNumber}
                            onValueChange={handlePhoneNumberInput}
                            type="tel"
                            displayType="input"
                            customInput={TextField}
                        />
                    </Box>
                )}
            </Paper>
        </>
    );
};

export default EditUser;
