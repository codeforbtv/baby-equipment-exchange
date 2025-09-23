'use client';

//Hooks
import { Dispatch, SetStateAction, useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
//Components
import { Box, FormControl, FormControlLabel, FormGroup, FormLabel, TextField, Checkbox, Button, FormHelperText, IconButton } from '@mui/material';
import { PatternFormat, OnValueChange } from 'react-number-format';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import CustomDialog from '@/components/CustomDialog';
import Loader from '@/components/Loader';
//Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

//API
import { addErrorEvent } from '@/api/firebase';
import { addOrganization } from '@/api/firebase-organizations';
//Types
import { orgTags, OrganizationTagKeys, OrganizationTagValues, organizationTags } from '@/models/organization';
import { IAddress } from '@/models/address';
import { OrganizationBody } from '@/types/OrganizationTypes';
//Styles
import '@/styles/globalStyles.css';

type DonationFormProps = {
    setShowForm?: Dispatch<SetStateAction<boolean>>;
    setOrgsUpdated?: Dispatch<SetStateAction<boolean>>;
};

export default function OrganizationForm(props: DonationFormProps) {
    const { setShowForm, setOrgsUpdated } = props;
    const defaultAddress: IAddress = {
        line_1: '',
        line_2: '',
        city: '',
        state: '',
        zipcode: ''
    };

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [address, setAddress] = useState<IAddress>(defaultAddress);
    const [county, setCounty] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [tags, setTags] = useState<OrganizationTagValues[]>(['mutual-aid']);
    const [error, setError] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [dialogText, setDialogText] = useState<string>('');
    const [dialogContent, setDialogContent] = useState<string>('');

    const { isAdmin } = useUserContext();
    const router = useRouter();

    const tagNames: OrganizationTagKeys[] = Object.keys(orgTags) as OrganizationTagKeys[];

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
        setIsLoading(true);
        if (!isAdmin) {
            setDialogText('Organization creation failed');
            setDialogContent('You must be an adminstrator to create a new organization');
            setIsLoading(false);
            setIsDialogOpen(true);
            return;
        }
        const orgToSubmit: OrganizationBody = {
            name: name,
            address: address,
            county: county,
            phoneNumber: phoneNumber,
            tags: tags,
            notes: []
        };
        try {
            await addOrganization(orgToSubmit);
            setIsLoading(false);
            setDialogText('Organization created successfully');
            setDialogContent(`Organization ${name} was created sucessfully.`);
            setIsDialogOpen(true);
            setName('');
            setAddress(defaultAddress);
            setPhoneNumber('');
            setTags([]);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Submit Organization', error);
        }
    };

    const handleClose = () => {
        if (setOrgsUpdated) setOrgsUpdated(true);
        if (setShowForm) {
            setIsDialogOpen(false);
            setShowForm(false);
        } else {
            setIsDialogOpen(false);
            router.push('/organizations');
        }
    };

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <h3>Create Organization</h3>
            </div>
            {setShowForm && (
                <IconButton onClick={() => setShowForm(false)}>
                    <ArrowBackIcon />
                </IconButton>
            )}
            {isLoading && <Loader />}
            {!isLoading && (
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
                            <TextField
                                type="text"
                                label="City"
                                name="city"
                                id="city"
                                placeholder="City"
                                onChange={handleAdressInput}
                                value={address.city}
                            ></TextField>
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
                        <TextField
                            type="text"
                            label="County"
                            name="county"
                            id="county"
                            placeholder="County"
                            onChange={(e) => setCounty(e.target.value)}
                            value={county}
                        ></TextField>
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
                    <CustomDialog isOpen={isDialogOpen} onClose={handleClose} title={dialogText} content={dialogContent} />
                </div>
            )}
        </ProtectedAdminRoute>
    );
}
