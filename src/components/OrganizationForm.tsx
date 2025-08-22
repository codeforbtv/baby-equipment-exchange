'use client';

import { useState } from 'react';

import { Box, FormControlLabel, FormGroup, TextField } from '@mui/material';
import { PatternFormat, OnValueChange } from 'react-number-format';

import { orgTags, OrganizationTagTypes } from '@/models/organization';
import { IAddress } from '@/models/address';
import { CheckBox } from '@mui/icons-material';

const defaultAddress: IAddress = {
    line_1: null,
    line_2: null,
    city: null,
    state: null,
    zipcode: null
};

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

    return (
        <div className="content--container">
            <Box component="form">
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
                <Box component="fieldset">
                    <legend>Address (Optional)</legend>
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
                </Box>
                <PatternFormat
                    id="phone-number"
                    format="+1 (###) ###-####"
                    mask="_"
                    label="Phone number (Optional)"
                    allowEmptyFormatting
                    value={phoneNumber}
                    onValueChange={handlePhoneNumberInput}
                    type="tel"
                    displayType="input"
                    customInput={TextField}
                    placeholder="+1 (___) ___-____"
                />
            </Box>
        </div>
    );
}
