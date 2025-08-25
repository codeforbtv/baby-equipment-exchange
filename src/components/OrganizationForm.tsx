'use client';

//Hooks
import { useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';

//Components
import {
    Box,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    TextField,
    Checkbox,
    Button,
    FormHelperText,
    Dialog,
    DialogTitle,
    DialogActions
} from '@mui/material';
import { PatternFormat, OnValueChange } from 'react-number-format';

//API
import { addErrorEvent } from '@/api/firebase';
import { addOrganization } from '@/api/firebase-organizations';

//Types
import { orgTags, OrganizationTagKeys, OrganizationTagValues, organizationTags } from '@/models/organization';
import { IAddress } from '@/models/address';

//Styles
import '../styles/globalStyles.css';
import { OrganizationBody } from '@/types/OrganizationTypes';

const defaultAddress: IAddress = {
    line_1: '',
    line_2: '',
    city: '',
    state: '',
    zipcode: ''
};

const tagNames: OrganizationTagKeys[] = Object.keys(orgTags) as OrganizationTagKeys[];

export default function OrganizationForm() {
    const [name, setName] = useState<string>('');
    const [address, setAddress] = useState<IAddress>(defaultAddress);
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [tags, setTags] = useState<OrganizationTagValues[]>(['mutual-aid']);
    const [error, setError] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);
    const [dialogText, setDialogText] = useState<string>('');

    const { isAdmin } = useUserContext();

    const handleAdressInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        setAddress((prevAddress) => {
            return {
                ...prevAddress,
                [name]: value
            };
        });
    };

    const handlePhoneNumberInput: OnValueChange = (values): void => {
        setPhoneNumber(values.formattedValue);
    };

    const handleCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { checked, value } = event.target;
        const updatedTags = checked ? [...tags, value] : tags.filter((tag) => tag !== value);
        setTags(updatedTags);
        setError(updatedTags.length === 0);
    };

    const handleSubmit = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        if (!isAdmin) {
            setDialogText('You must be an adminstrator to create a new organization.');
            setOpen(true);
            return;
        }
        const orgToSubmit: OrganizationBody = {
            name: name,
            address: address,
            phoneNumber: phoneNumber,
            tags: tags,
            notes: []
        };
        try {
            await addOrganization(orgToSubmit);
            setDialogText('Organization created successfully');
            setOpen(true);
            setName('');
            setAddress(defaultAddress);
            setPhoneNumber('');
            setTags([]);
        } catch (error) {
            addErrorEvent('Submit Organization', error);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setDialogText('');
    };

    return (
        <div className="content--container">
            <Box component="form" display={'flex'} flexDirection={'column'} gap={4} className="form--container" onSubmit={handleSubmit}>
                <TextField
                    type="text"
                    label="Name"
                    name="name"
                    id="name"
                    placeholder="Name"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
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
                        value={address.line_1}
                    ></TextField>
                    <TextField
                        type="text"
                        label="Address Line 2"
                        name="line_2"
                        id="line_2"
                        placeholder="Address Line 2"
                        onChange={handleAdressInput}
                        value={address.line_2}
                    ></TextField>
                    <TextField type="text" label="City" name="city" id="city" placeholder="City" onChange={handleAdressInput} value={address.city}></TextField>
                    <TextField
                        type="text"
                        label="State"
                        name="state"
                        id="state"
                        placeholder="State"
                        onChange={handleAdressInput}
                        value={address.state}
                    ></TextField>
                    <TextField
                        type="text"
                        label="Zip Code"
                        name="zipcode"
                        id="zipcode"
                        placeholder="Address"
                        onChange={handleAdressInput}
                        value={address.zipcode}
                    ></TextField>
                </FormControl>
                <PatternFormat
                    id="phone-number"
                    format="+1 (###) ###-####"
                    mask="_"
                    name="phone-number"
                    label="Phone number (Optional)"
                    allowEmptyFormatting
                    value={phoneNumber}
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
                                        checked={tags.includes(orgTags[tag as keyof organizationTags])}
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
                    Create Organization
                </Button>
            </Box>
            <Dialog open={open} onClose={handleClose} aria-labelledby="dialog-title">
                <DialogTitle id="dialog-title">{dialogText}</DialogTitle>
                <DialogActions>
                    <Button variant="contained" onClick={handleClose}>
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
