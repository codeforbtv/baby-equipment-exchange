'use client';

//Hooks
import { Dispatch, ReactElement, SetStateAction, useEffect, useState } from 'react';
//API
import { updateDonation } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';
import { getAllCategories, getTagNumber } from '@/api/firebase-categories';
import { appendImagesToState, removeImageFromState } from '@/controllers/images';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import Loader from './Loader';
import { Paper, Box, TextField, Button, Stack, Typography, Autocomplete } from '@mui/material';
import CustomDialog from './CustomDialog';
import InputContainer from './InputContainer';
import ImageThumbnail from './ImageThumbnail';
//Icons
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/DonationForm.module.css';
//Types
import { IDonation } from '@/models/donation';
import { Category } from '@/models/category';
import { uploadImages } from '@/api/firebase-images';

type EditDonationProps = {
    donationDetails: IDonation;
    setIsEditMode: Dispatch<SetStateAction<boolean>>;
    fetchDonation: (id: string) => void;
    setDonationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const EditDonation = (props: EditDonationProps) => {
    const { id, category, brand, model, description, status, tagNumber, images, requestor } = props.donationDetails;
    const { setIsEditMode, fetchDonation, setDonationsUpdated } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [categories, setCategories] = useState<Category[] | null>(null);
    const [newCategory, setNewCategory] = useState<string | null>(category);
    const [newTagNumber, setNewTagnumber] = useState<string | undefined | null>(tagNumber);
    const [newBrand, setNewBrand] = useState<string>(brand);
    const [newModel, setNewModel] = useState<string>(model);
    const [newDescription, setNewDescription] = useState<string>(description ?? '');
    const [newImages, setNewImages] = useState<string[]>(images);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const [addedImages, setAddedImages] = useState<File[] | null>();

    const fetchCategories = async (): Promise<void> => {
        try {
            setIsLoading(true);
            const categoriesResult = await getAllCategories();
            setCategories(categoriesResult);
        } catch (error) {
            addErrorEvent('Error fetching all categories: ', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (setDonationsUpdated) setDonationsUpdated(true);
        setIsDialogOpen(false);
        setIsEditMode(false);
        fetchDonation(id);
    };

    const handleCategoryChange = (event: any, newValue: string | null) => {
        setNewCategory(newValue);
    };

    const handleRemoveExistingImage = (url: string) => {
        setNewImages(newImages.filter((image) => image !== url));
    };

    const handleSubmitUpdatedDonation = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);

        try {
            let addedImageUrls: string[] = [];
            if (addedImages) {
                addedImageUrls = await uploadImages(addedImages);
            }
            const updatedDonation = {
                category: newCategory,
                tagNumber: newTagNumber,
                brand: newBrand,
                model: newModel,
                description: newDescription,
                images: [...newImages, ...addedImageUrls]
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
        if (newCategory) {
            const assignedTagNumber = await getTagNumber(newCategory);
            setNewTagnumber(assignedTagNumber);
        }
    };

    useEffect(() => {
        if (!tagNumber) assignTagNumber();
        if (!categories) fetchCategories();
    }, []);

    useEffect(() => {
        console.log('added images', addedImages);
        console.log('newimages', newImages);
    }, [addedImages, newImages]);

    return (
        <ProtectedAdminRoute>
            <Paper className="content--container" elevation={8} square={false}>
                {isLoading && <Loader />}
                {!isLoading && !categories && <Typography variant="body1">Could not load edit donation form. Please try again later. </Typography>}
                {!isLoading && categories && (
                    <Box component="form" className={styles['form']} onSubmit={handleSubmitUpdatedDonation}>
                        <Box className={styles['form__section--left']} gap={3} display={'flex'} flexDirection={'column'}>
                            <Autocomplete
                                sx={{ maxWidth: { sm: '88%', xs: '80%' } }}
                                disablePortal
                                options={categories.map((option) => option.name)}
                                renderInput={(params) => <TextField {...params} label="Category" />}
                                value={newCategory}
                                onChange={handleCategoryChange}
                                aria-label="Category"
                            />
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
                                rows={4}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>): void => setNewDescription(event.target.value)}
                                value={newDescription}
                                required
                            />
                        </Box>
                        <Box className={styles['form__section--right']}>
                            <InputContainer for="images" label="Images">
                                <div className={styles['image-uploader__container']}>
                                    {newImages.map((image) => (
                                        <ImageThumbnail
                                            key={image}
                                            url={image}
                                            width={'32%'}
                                            margin={'.66%'}
                                            removeFromDb={() => handleRemoveExistingImage(image)}
                                        />
                                    ))}
                                    <div className={styles['image-uploader__display']}>
                                        {addedImages &&
                                            addedImages.map((image) => (
                                                <ImageThumbnail
                                                    key={image.name}
                                                    file={image}
                                                    width={'32%'}
                                                    margin={'.66%'}
                                                    removeFromState={(fileToRemove: File) => removeImageFromState(addedImages, setAddedImages, fileToRemove)}
                                                />
                                            ))}
                                    </div>
                                    <div className={styles['image-uploader__input']}>
                                        <label id="labelForImages" htmlFor="images">
                                            <input
                                                required
                                                type="file"
                                                id="images"
                                                name="images"
                                                accept="image/*"
                                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                                    appendImagesToState(addedImages, setAddedImages, event)
                                                }
                                                multiple
                                            />
                                            <Button variant="contained" component="span" className={styles['form-btn']} endIcon={<AddPhotoAlternateIcon />}>
                                                Add Image
                                            </Button>
                                        </label>
                                    </div>
                                </div>
                            </InputContainer>
                        </Box>
                        <Box className={styles['form__section--bottom']}>
                            <Button variant="contained" type="submit" disabled={(!addedImages || addedImages.length === 0) && newImages.length === 0}>
                                Save changes
                            </Button>
                            <Button variant="outlined" type="button" onClick={() => setIsEditMode(false)}>
                                Cancel
                            </Button>
                        </Box>
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
