'use client';

//Hooks
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
//API
import { updateDonation } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';
import { getTagNumber } from '@/api/firebase-categories';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import Loader from './Loader';
import { Paper, Box, TextField, Select, FormControl, InputLabel, SelectChangeEvent, MenuItem, Button, Stack } from '@mui/material';
import CustomDialog from './CustomDialog';
//Constants
import { categories } from '@/data/html';
//Styles
import '@/styles/globalStyles.css';
//Types
import { IDonation } from '@/models/donation';

type EditDonationProps = {
    donationDetails: IDonation;
    setIsEditMode: Dispatch<SetStateAction<boolean>>;
    fetchDonation: (id: string) => void;
    setDonationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const EditDonation = (props: EditDonationProps) => {
    const { id, category, brand, model, description, status, tagNumber, requestor } = props.donationDetails;
    const { setIsEditMode, fetchDonation, setDonationsUpdated } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [newCategory, setNewCategory] = useState<string>(category);
    const [newTagNumber, setNewTagnumber] = useState<string | undefined | null>(tagNumber);
    const [newBrand, setNewBrand] = useState<string>(brand);
    const [newModel, setNewModel] = useState<string>(model);
    const [newDescription, setNewDescription] = useState<string>(description ?? '');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleClose = () => {
        if (setDonationsUpdated) setDonationsUpdated(true);
        setIsDialogOpen(false);
        setIsEditMode(false);
        fetchDonation(id);
    };

    const handleCategoryChange = (event: SelectChangeEvent) => {
        setNewCategory(event.target.value);
    };

    const handleSubmitUpdatedDonation = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);

        try {
            const updatedDonation = {
                category: newCategory,
                tagNumber: newTagNumber,
                brand: newBrand,
                model: newModel,
                description: newDescription
            };
            await updateDonation(id, updatedDonation);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error submitting donation update', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const assignTagNumber = async () => {
        const assignedTagNumber = await getTagNumber(category);
        setNewTagnumber(assignedTagNumber);
    };

    useEffect(() => {
        if (!tagNumber) assignTagNumber();
    }, []);

    return (
        <ProtectedAdminRoute>
            <Paper className="content--container" elevation={8} square={false}>
                {isLoading ? (
                    <Loader />
                ) : (
                    <Box component="form" gap={3} display={'flex'} flexDirection={'column'} className="form--container" onSubmit={handleSubmitUpdatedDonation}>
                        <FormControl fullWidth>
                            <InputLabel id="category-label">Category</InputLabel>
                            <Select labelId="category-label" id="category" value={newCategory} label="Category" onChange={handleCategoryChange}>
                                {categories.map((category) => (
                                    <MenuItem key={category.name} value={category.name}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {status !== 'rejected' && (
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    type="text"
                                    label="Tag Number"
                                    name="tagNumber"
                                    id="tagNumber"
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>): void => setNewTagnumber(event.target.value)}
                                    value={newTagNumber}
                                />
                                <Button variant="text" type="button" onClick={assignTagNumber}>
                                    Generate New Tag Number
                                </Button>
                            </Stack>
                        )}

                        <TextField
                            type="text"
                            label="Brand"
                            name="brand"
                            id="brand"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>): void => setNewBrand(event.target.value)}
                            value={newBrand}
                            required
                        />
                        <TextField
                            type="text"
                            label="Model"
                            name="model"
                            id="model"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>): void => setNewModel(event.target.value)}
                            value={newModel}
                            required
                        />
                        <TextField
                            multiline={true}
                            type="text"
                            label="Description"
                            name="description"
                            id="description"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>): void => setNewDescription(event.target.value)}
                            value={newDescription}
                            required
                        />
                        <Button variant="contained" type="submit">
                            Save changes
                        </Button>
                        <Button variant="outlined" type="button" onClick={() => setIsEditMode(false)}>
                            Cancel
                        </Button>
                    </Box>
                )}
            </Paper>
            <CustomDialog
                isOpen={isDialogOpen}
                onClose={handleClose}
                title="Donation updated"
                content={`The donation ${newModel} has been updated successfully.`}
            />
        </ProtectedAdminRoute>
    );
};

export default EditDonation;
