'use client';

//Hooks
import { useState, Dispatch, SetStateAction } from 'react';
import { useUserContext } from '@/contexts/UserContext';
//Components
import { Box, FormControl, FormControlLabel, FormGroup, FormLabel, TextField, Checkbox, Button, FormHelperText } from '@mui/material';
import { PatternFormat, OnValueChange } from 'react-number-format';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import CustomDialog from '@/components/CustomDialog';
import Loader from '@/components/Loader';
//API
import { addErrorEvent } from '@/api/firebase';
import { addOrganization, updateOrganization } from '@/api/firebase-organizations';
//Types
import { orgTags, OrganizationTagKeys, OrganizationTagValues, organizationTags, IOrganization } from '@/models/organization';
import { IAddress } from '@/models/address';
import { OrganizationBody } from '@/types/OrganizationTypes';
//Styles
import '@/styles/globalStyles.css';

const tagNames: OrganizationTagKeys[] = Object.keys(orgTags) as OrganizationTagKeys[];

type EditOrganizationProps = {
    organizationDetails: IOrganization;
    setIsEditMode: Dispatch<SetStateAction<boolean>>;
    setOrgsUpdated?: Dispatch<SetStateAction<boolean>>;
    fetchDonationDetails: (id: string) => void;
};

const defaultAddress: IAddress = {
    line_1: '',
    line_2: '',
    city: '',
    state: '',
    zipcode: ''
};

const EditOrganization = (props: EditOrganizationProps) => {
    const { id, name, address, county, phoneNumber, tags } = props.organizationDetails;
    const { setIsEditMode, fetchDonationDetails, setOrgsUpdated } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [newName, setNewName] = useState<string>(name);
    const [newAddress, setNewAddress] = useState<IAddress>(address ?? defaultAddress);
    const [newCounty, setNewCounty] = useState<string>(county ?? '');
    const [newPhoneNumber, setNewPhoneNumber] = useState<string>(phoneNumber ?? '');
    const [newTags, setNewTags] = useState<OrganizationTagValues[]>([...tags]);
    const [error, setError] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleClose = () => {
        if (setOrgsUpdated) setOrgsUpdated(true);
        setIsDialogOpen(false);
        setIsEditMode(false);
        fetchDonationDetails(id);
    };

    const handleAdressInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        setNewAddress((prevAddress) => {
            return {
                ...prevAddress,
                [name]: value
            };
        });
    };

    const handlePhoneNumberInput: OnValueChange = (values): void => {
        setNewPhoneNumber(values.formattedValue);
    };

    const handleCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { checked, value } = event.target;
        const updatedTags = checked ? [...newTags, value] : newTags.filter((tag) => tag !== value);
        setNewTags(updatedTags);
        setError(updatedTags.length === 0);
    };

    const handleSubmitUpdatedOrg = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);
        try {
            const updatedOrganization = {
                name: newName,
                address: newAddress,
                county: newCounty,
                phoneNumber: newPhoneNumber,
                tags: newTags
            };
            await updateOrganization(id, updatedOrganization);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Error submitting organization update', error);
        }
        setIsLoading(false);
        setIsDialogOpen(true);
    };

    return (
        <ProtectedAdminRoute>
            {isLoading && <Loader />}
            {!isLoading && (
                <div className="content--container">
                    <Box component="form" display={'flex'} flexDirection={'column'} gap={4} className="form--container" onSubmit={handleSubmitUpdatedOrg}>
                        <TextField
                            type="text"
                            label="Name"
                            name="name"
                            id="name"
                            placeholder="Name"
                            onChange={(e) => setNewName(e.target.value)}
                            value={newName}
                            required
                        ></TextField>
                        <FormControl component="fieldset" sx={{ display: 'flex', gap: 2 }}>
                            <FormLabel component="legend">Adresss (Optional)</FormLabel>
                            <TextField
                                type="text"
                                label="Address"
                                name="line_1"
                                id="line_1"
                                placeholder="Address"
                                onChange={handleAdressInput}
                                value={newAddress.line_1}
                            ></TextField>
                            <TextField
                                type="text"
                                label="Address Line 2"
                                name="line_2"
                                id="line_2"
                                placeholder="Address Line 2"
                                onChange={handleAdressInput}
                                value={newAddress.line_2}
                            ></TextField>
                            <TextField
                                type="text"
                                label="City"
                                name="city"
                                id="city"
                                placeholder="City"
                                onChange={handleAdressInput}
                                value={newAddress.city}
                            ></TextField>
                            <TextField
                                type="text"
                                label="State"
                                name="state"
                                id="state"
                                placeholder="State"
                                onChange={handleAdressInput}
                                value={newAddress.state}
                            ></TextField>
                            <TextField
                                type="text"
                                label="Zip Code"
                                name="zipcode"
                                id="zipcode"
                                placeholder="Address"
                                onChange={handleAdressInput}
                                value={newAddress.zipcode}
                            ></TextField>
                        </FormControl>
                        <TextField
                            type="text"
                            label="County"
                            name="county"
                            id="county"
                            placeholder="County"
                            onChange={(e) => setNewCounty(e.target.value)}
                            value={newCounty}
                        ></TextField>
                        <PatternFormat
                            id="phone-number"
                            format="+1 (###) ###-####"
                            mask="_"
                            name="phone-number"
                            label="Phone number (Optional)"
                            allowEmptyFormatting
                            value={newPhoneNumber}
                            onValueChange={handlePhoneNumberInput}
                            type="tel"
                            displayType="input"
                            customInput={TextField}
                        />
                        <FormControl component="fieldset" sx={{ display: 'flex' }} error={error}>
                            <FormLabel component="legend">Organizaton type (Select all that apply)</FormLabel>
                            <FormGroup sx={{ display: 'flex', flexDirection: 'row' }}>
                                {tagNames.map((tag: OrganizationTagKeys) => (
                                    <FormControlLabel
                                        key={tag}
                                        control={
                                            <Checkbox
                                                name={`${tag}`}
                                                onChange={handleCheck}
                                                value={orgTags[tag as keyof organizationTags]}
                                                checked={newTags.includes(orgTags[tag as keyof organizationTags])}
                                                inputProps={{ 'aria-label': `${tag}` }}
                                            />
                                        }
                                        label={`${tag}`}
                                    />
                                ))}
                            </FormGroup>
                            {error && <FormHelperText>At least one organization type must be selected.</FormHelperText>}
                        </FormControl>
                        <Button type="submit" variant="contained" disabled={error}>
                            Save Changes
                        </Button>
                        <Button type="button" variant="outlined" onClick={() => setIsEditMode(false)}>
                            Cancel
                        </Button>
                    </Box>
                    <CustomDialog
                        isOpen={isDialogOpen}
                        onClose={handleClose}
                        title="Organization updated"
                        content={`Organization ${newName} has been successfully updated.`}
                    />
                </div>
            )}
        </ProtectedAdminRoute>
    );
};

export default EditOrganization;
