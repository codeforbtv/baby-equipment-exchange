//API
import { callGetUidByEmail, callIsEmailInUse, callRegisterNewUser, callSetClaims } from '@/api/firebase';
//Styles
import { Button, Checkbox, Dialog, DialogActions, DialogContent, FormControl, FormControlLabel, FormGroup, FormLabel, TextField } from '@mui/material';
import React, { useState } from 'react';

export default function NewUserDialog({
    initialParameters,
    controllers
}: {
    initialParameters: { [key: string]: boolean };
    controllers: { [key: string]: () => void };
}) {
    const [displayName, setDisplayName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [passwordsDoNotMatch, setPasswordsDoNotMatch] = useState<boolean>(false);
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [website, setWebsite] = useState<string>('');
    const [addressLine1, setAddressLine1] = useState<string>('');
    const [city, setCity] = useState<string>('');
    const [state, setState] = useState<string>('');
    const [zipcode, setZipcode] = useState<string>('');
    const [canReadDonations, setCanReadDonations] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isAidWorker, setIsAidWorker] = useState<boolean>(false);
    const [isDonor, setIsDonor] = useState<boolean>(false);
    const [emailInvalid, setEmailInvalid] = useState<boolean>(false);
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [isVolunteer, setIsVolunteer] = useState<boolean>(false);

    function handleFormSubmit() {
        if (displayName != null && email != null && password != null) {
            callRegisterNewUser({
                options: {
                    displayName: displayName,
                    email: email,
                    password: password,
                    claims: {
                        admin: isAdmin,
                        'aid-worker': isAidWorker,
                        donor: isDonor,
                        volunteer: isVolunteer,
                        verified: isVerified,
                        'can-read-donations': canReadDonations
                    }
                }
            }).then((response: any) => {
                if (response.ok) {
                    setDisplayName('');
                    setEmail('');
                    setPassword('');
                    setPasswordsDoNotMatch(false);
                    setConfirmPassword('');
                    setPhoneNumber('');
                    setWebsite('');
                    setAddressLine1('');
                    setCity('');
                    setState('');
                    setZipcode('');
                    setCanReadDonations(false);
                    setIsAdmin(false);
                    setIsAidWorker(false);
                    setIsDonor(false);
                    setEmailInvalid(false);
                    setIsVerified(false);
                    setIsVolunteer(false);
                    controllers.closeController();
                }
            });
        }
    }

    const handleDisplayNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayName(event.target.value);
    };

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
    };

    const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPhoneNumber(event.target.value);
    };

    const handleWebsiteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setWebsite(event.target.value);
    };

    const handleStreetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAddressLine1(event.target.value);
    };

    const handleCityChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setCity(event.target.value);
    };

    const handleStateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setState(event.target.value);
    };

    const handlePassword = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setPassword(event.target.value);
        if (confirmPassword != null && confirmPassword.length != 0 && event.target.value != confirmPassword) {
            setPasswordsDoNotMatch(true);
        } else {
            setPasswordsDoNotMatch(false);
        }
    };

    const handleConfirmPassword = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setConfirmPassword(event.target.value);
        if (password != null && password.length != 0 && event.target.value != password) {
            setPasswordsDoNotMatch(true);
        } else {
            setPasswordsDoNotMatch(false);
        }
    };

    const handleZipcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setZipcode(event.target.value);
    };

    const handleToggleIsAdmin = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsAdmin(!isAdmin);
    };

    const handleToggleIsAidWorker = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsAidWorker(!isAidWorker);
    };

    const handleToggleCanReadDonations = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCanReadDonations(!canReadDonations);
    };

    const handleToggleIsDonor = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsDonor(!isDonor);
    };

    const handleToggleIsVerified = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsVerified(!isVerified);
    };

    const handleToggleIsVolunteer = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsVolunteer(!isVolunteer);
    };

    const validateEmail = async (): Promise<void> => {
        if (email != null) {
            setEmailInvalid(await callIsEmailInUse(email));
        }
    };

    return (
        <Dialog open={initialParameters.initAsOpen} onClose={controllers.closeController}>
            <DialogContent>
                <h3>New user</h3>
                <FormControl sx={{ display: 'flex', gap: 1 }} component="fieldset">
                    <FormLabel component="legend">Roles</FormLabel>
                    <FormGroup id="roles" aria-label="Roles" row>
                        <FormControlLabel label="Administrator" control={<Checkbox checked={isAdmin} onChange={handleToggleIsAdmin} />} />
                        <FormControlLabel label="Aid Worker" control={<Checkbox checked={isAidWorker} onChange={handleToggleIsAidWorker} />} />
                        <FormControlLabel label="Donor" control={<Checkbox checked={isDonor} onChange={handleToggleIsDonor} />} />
                        <FormControlLabel label="Volunteer" control={<Checkbox checked={isVolunteer} onChange={handleToggleIsVolunteer} />} />
                    </FormGroup>
                    <FormLabel component="legend">Verification</FormLabel>
                    <FormControlLabel label="Verified" control={<Checkbox checked={isVerified} onChange={handleToggleIsVerified} />} />
                    <FormLabel component="legend">Permission</FormLabel>
                    <FormControlLabel label="Reading Donations" control={<Checkbox checked={canReadDonations} onChange={handleToggleCanReadDonations} />} />
                    <FormLabel component="legend">Required Fields</FormLabel>
                    <TextField
                        error={emailInvalid}
                        helperText={emailInvalid ? 'Invalid Email.' : undefined}
                        id="contactEmail"
                        inputProps={{
                            onBlur: validateEmail
                        }}
                        label="Email"
                        name="contactEmail"
                        onChange={handleEmailChange}
                        placeholder="Input email"
                        type="email"
                        value={email}
                        variant="outlined"
                        required
                    />
                    <TextField
                        type="text"
                        label="Display Name"
                        placeholder="Input display name"
                        name="displayName"
                        id="displayName"
                        onChange={handleDisplayNameChange}
                        value={displayName}
                        variant="outlined"
                        required
                    />
                    <TextField
                        type="password"
                        label="Password"
                        placeholder="Input password for new user"
                        name="password"
                        onChange={handlePassword}
                        value={password}
                        required
                    />
                    <TextField
                        type="password"
                        label="Confirm Password"
                        name="confirmPassword"
                        id="confirmPassword"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        error={passwordsDoNotMatch}
                        helperText={passwordsDoNotMatch ? 'Passwords do not match.' : undefined}
                        onChange={handleConfirmPassword}
                        required
                    />
                    <FormLabel component="legend">Contact Details</FormLabel>
                    <TextField
                        type="tel"
                        label="Phone Number"
                        placeholder="input phone number"
                        name="contactPhone"
                        id="contactPhone"
                        onChange={handlePhoneNumberChange}
                        value={phoneNumber}
                        variant="outlined"
                    />
                    <TextField
                        type="text"
                        label="Website"
                        placeholder="Input website"
                        name="website"
                        id="website"
                        onChange={handleWebsiteChange}
                        value={website}
                        variant="outlined"
                    />
                    <FormLabel component="legend">Location Details</FormLabel>
                    <TextField
                        type="text"
                        label="Street Address"
                        placeholder="Input street address"
                        name="street"
                        id="street"
                        onChange={handleStreetChange}
                        value={addressLine1}
                        variant="outlined"
                    />
                    <TextField
                        type="text"
                        label="City"
                        placeholder="Input city"
                        name="city"
                        id="city"
                        onChange={handleCityChange}
                        value={city}
                        variant="outlined"
                    />
                    <TextField
                        type="text"
                        label="State"
                        placeholder="Input state"
                        name="state"
                        id="state"
                        onChange={handleStateChange}
                        value={state}
                        variant="outlined"
                    />
                    <TextField
                        type="text"
                        label="Zipcode"
                        placeholder="Input zipcode"
                        name="zipcode"
                        id="zipcode"
                        onChange={handleZipcodeChange}
                        value={zipcode}
                        variant="outlined"
                    />
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleFormSubmit}>create</Button>
                <Button onClick={controllers.closeController}>close</Button>
            </DialogActions>
        </Dialog>
    );
}
