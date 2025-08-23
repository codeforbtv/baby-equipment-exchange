'use client';

import { useEffect, useState } from 'react';

import { Box, FormControl, FormControlLabel, FormGroup, FormLabel, TextField, Checkbox } from '@mui/material';
import { PatternFormat, OnValueChange } from 'react-number-format';

import { orgTags, OrganizationTagTypes, OrganizationKeyTypes, organizationTags } from '@/models/organization';
import { IAddress } from '@/models/address';

import '../styles/globalStyles.css';

const defaultAddress: IAddress = {
    line_1: null,
    line_2: null,
    city: null,
    state: null,
    zipcode: null
};

const tagNames: OrganizationKeyTypes[] = Object.keys(orgTags) as OrganizationKeyTypes[];

export default function OrganizationForm() {
    const [name, setName] = useState<string>('');
    const [address, setAddress] = useState<IAddress>(defaultAddress);
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [tags, setTags] = useState<OrganizationTagTypes[]>([]);
    const [notes, setNotes] = useState<string[]>([]);

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
        if (event.target.checked) {
            setTags((prev) => [...prev, event.target.value]);
        } else {
            setTags(tags.filter((tag) => tag !== event.target.value));
        }
    };

    return (
        <div className="content--container">
            <Box component="form" display={'flex'} flexDirection={'column'} gap={4} className="form--container">
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
                <FormControl component="fieldset">
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
                    placeholder="+1 (___) ___-____"
                />
                <FormControl component="fieldset" sx={{ display: 'flex' }}>
                    <FormLabel component="legend">Organizaton type</FormLabel>
                    <FormGroup sx={{ display: 'flex', border: 'solid 1px red', flexDirection: 'row' }}>
                        {tagNames.map((tag: OrganizationTagTypes) => (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name={`${tag}`}
                                        onChange={handleCheck}
                                        value={orgTags[tag as keyof organizationTags]}
                                        inputProps={{ 'aria-label': `${tag}` }}
                                    />
                                }
                                label={`${tag}`}
                            />
                        ))}
                    </FormGroup>
                </FormControl>
            </Box>
        </div>
    );
}
