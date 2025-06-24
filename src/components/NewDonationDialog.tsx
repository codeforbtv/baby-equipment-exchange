'use client';

// Hooks
import React, { ReactElement, useEffect, useState } from 'react';
import Link from 'next/link';
// Containers
import { Box, Button, Dialog, DialogActions, DialogContent, FormControl, FormLabel, NativeSelect, TextField } from '@mui/material';
import InputContainer from './InputContainer';
// Controllers
import { appendImagesToState, removeImageFromState } from '@/controllers/images';
// Data
import { categories } from '@/data/html';
// Styles
import donationStyles from '@/app/donate/Donate.module.css';
import ImageThumbnail from './ImageThumbnail';
import { addDonation } from '@/api/firebase-donations';
import { uploadImages } from '@/api/firebase-images';
import { USERS_COLLECTION } from '@/api/firebase-users';
import { doc } from 'firebase/firestore';
import { db } from '@/api/firebase';
import { useUserContext } from '@/contexts/UserContext';

export default function NewDonationDialog({
    initialParameters,
    controllers
}: {
    initialParameters: { [key: string]: boolean };
    controllers: { [key: string]: () => void };
}) {
    const [category, setCategory] = useState<string>('');
    const [brand, setBrand] = useState<string>('');
    const [model, setModel] = useState<string>('');
    const [donorEmail, setDonorEmail] = useState<string>('');
    const [donorName, setDonorName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [imageElements, setImageElements] = useState<ReactElement[]>([]);
    const [images, setImages] = useState<File[] | null>();
    const { currentUser } = useUserContext();

    useEffect(() => {
        const tempImages = [];
        if (images) {
            for (let i = 0; i < images.length; i++) {
                const imagePreview = (
                    <ImageThumbnail
                        key={i}
                        removeFunction={(fileToRemove: File) => removeImageFromState(images, setImages, fileToRemove)}
                        file={images[i]}
                        width={'32%'}
                        margin={'.66%'}
                    />
                );
                tempImages.push(imagePreview);
            }
            setImageElements(tempImages);
        }
    }, [images]);

    //Use this to handle passing form data to the database on submission
    async function handleFormSubmit() {
        try {
            let imageRefs: string[] = [];

            if (currentUser == null) {
                throw new Error('Unable to access the user account.');
            }

            const userId = currentUser.uid;
            const userRef = doc(db, `${USERS_COLLECTION}/${userId}`);

            //upload images if included
            if (images) {
                imageRefs = await uploadImages(images);
            }

            const newDonation = {
                user: userRef,
                brand,
                category,
                model,
                description,
                donorEmail,
                donorName,
                images: imageRefs
            };

            await addDonation(newDonation);
            setCategory('');
            setBrand('');
            setDescription('');
            setImages(null);
            setModel('');
            controllers.closeController();
        } catch (error) {
            // eslint-disable-line no-empty
            console.log(error);
        }
    }

    const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        setCategory(event.target.value);
    };

    const handleBrandChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setBrand(event.target.value);
    };

    const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setModel(event.target.value);
    };

    const handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setDescription(event.target.value);
    };

    return (
        <Dialog open={initialParameters.initAsOpen} onClose={controllers.closeController}>
            <DialogContent>
                <h3>New Donation</h3>
                <p style={{ color: 'red' }}>
                    THIS PAGE IS DEPRECATED. YOU CAN SUBMIT A DONATION <Link href="/donate">HERE</Link>
                </p>
                <p>
                    Vermont Connector does not have the capacity to verify recall and safety guidelines for each individual item donated. That said, we do not
                    accept items that have stringent health or safety requirements (such as car seats, booster seats, breast pumps) or that could be subject to
                    recall (such as cribs). We ask that donors only offer items that are clean, in good working order, and not subject to recall.
                </p>
                <p>Please reference the following web pages if you have any questions about safety/recall status of these items:</p>
                <ul>
                    <li>
                        Consumer Product Safety Commission (<a href="https://www.cpsc.gov/">cpsc.gov</a>)
                    </li>
                    <li>Reseller&apos;s Guide to Selling Safer Products</li>
                    <li>
                        SaferProducts.gov (<a href="https://www.saferproducts.gov">saferproducts.gov</a>)
                    </li>
                    <li>
                        Recalls.gov (<a href="https://www.recalls.gov/">recalls.gov</a>)
                    </li>
                    <li>
                        Safercar.gov (<a href="https://www.nhtsa.gov/campaign/safercargov?redirect-safercar-sitewide">safercar.gov</a>)
                    </li>
                </ul>
                <FormControl sx={{ display: 'flex', gap: 1 }} component="fieldset">
                    <FormLabel component="legend">Details</FormLabel>
                    <NativeSelect
                        variant="outlined"
                        style={{ padding: '.25rem .5rem' }}
                        name="category"
                        id="category"
                        placeholder="Category"
                        onChange={handleCategoryChange}
                        value={category}
                        required
                    >
                        <option value="">Select Category</option>
                        {categories.map((category) => {
                            return (
                                <option key={category.value} value={category.value}>
                                    {category.innerText}
                                </option>
                            );
                        })}
                    </NativeSelect>
                    <TextField type="text" label="Brand" name="brand" id="brand" placeholder=" Brand" onChange={handleBrandChange} value={brand} required />
                    <TextField type="text" label="Model" name="model" id="model" onChange={handleModelChange} value={model} required />
                    <TextField
                        multiline={true}
                        name="description"
                        label="Description"
                        rows={12}
                        placeholder="Provide details about the item"
                        id="description"
                        onChange={handleDescriptionChange}
                        value={description}
                        required
                    />
                    <Box className={donationStyles['form__section--right']}>
                        <InputContainer for="images" label="Upload images" footnote="[Footnote]">
                            <div className={donationStyles['image-uploader__container']}>
                                <div className={donationStyles['image-uploader__display']}>{imageElements && imageElements}</div>
                                <div className={donationStyles['image-uploader__input']}>
                                    <label id="labelForImages" htmlFor="images">
                                        <input
                                            type="file"
                                            id="images"
                                            name="images"
                                            accept="image/png, image/jpeg"
                                            capture="environment"
                                            onChange={(event: React.ChangeEvent<HTMLInputElement>): void => appendImagesToState(images, setImages, event)}
                                            multiple
                                        />
                                        <Button variant="contained" component="span">
                                            Add Files
                                        </Button>
                                    </label>
                                </div>
                            </div>
                        </InputContainer>
                    </Box>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleFormSubmit}>create</Button>
                <Button onClick={controllers.closeController}>close</Button>
            </DialogActions>
        </Dialog>
    );
}
