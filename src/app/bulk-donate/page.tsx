'use client';
import InputContainer from '@/components/InputContainer';
import ImageThumbnail from '@/components/ImageThumbnail';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Box, Button, NativeSelect, TextField } from '@mui/material';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import ToasterNotification from '@/components/ToasterNotification';
import Loader from '@/components/Loader';
import { useState, useEffect, ReactElement, ReactEventHandler } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/UserContext';
import { uploadImages } from '@/api/firebase-images';
import { addBulkDonation, addDonation } from '@/api/firebase-donations';
import '../../styles/globalStyles.css';
import styles from './Donate.module.css';
import { DocumentReference, doc } from 'firebase/firestore';
import { USERS_COLLECTION } from '@/api/firebase-users';
import { addErrorEvent, db } from '@/api/firebase';
import { appendImagesToState, removeImageFromState } from '@/controllers/images';
import { categories } from '@/data/html';
import { DonationBody } from '@/types/post-data';

type DonationFormData = {
    category: string | null;
    brand: string | null;
    model: string | null;
    description: string | null;
    images: File[] | null | undefined;
};

//This will be initially set from the database if editing an existing donation
const dummyDonationData: DonationFormData = {
    category: 'Option A',
    brand: 'Brand Name',
    model: 'Model Name',
    description: '',
    images: null
};

export default function BulkDonate() {
    const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'error'>('idle');
    const [formData, setFormData] = useState<DonationFormData>({
        category: '',
        brand: '',
        model: '',
        description: '',
        images: null
    });
    const [images, setImages] = useState<File[] | null>();
    const [imageElements, setImageElements] = useState<ReactElement[]>([]);
    const [bulkDonations, setBulkDonations] = useState<DonationBody[]>([]);
    const { currentUser } = useUserContext();
    const router = useRouter();

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

    useEffect(() => {
        console.log(bulkDonations);
    }, [bulkDonations]);

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLTextAreaElement>) {
        setFormData((prev) => {
            return { ...prev, [e.target.name]: e.target.value };
        });
    }

    //Use this to handle passing form data to the database on submission
    async function handleAddDonation(e: React.SyntheticEvent) {
        e.preventDefault();
        try {
            setSubmitState('submitting');
            let imageRefs: DocumentReference[] = [];

            if (currentUser == null) {
                throw new Error('Unable to access the user account.');
            }

            const userId = currentUser.uid;
            const userRef = doc(db, `${USERS_COLLECTION}/${userId}`);

            //upload images if included
            if (images) {
                imageRefs = await uploadImages(images);
            }

            const newDonation: DonationBody = {
                user: userRef,
                brand: formData.brand ?? '',
                category: formData.category ?? '',
                model: formData.model ?? '',
                description: formData.description ?? '',
                images: imageRefs
            };

            setBulkDonations((prev) => [...prev, newDonation]);
            setFormData({
                category: '',
                brand: '',
                model: '',
                description: '',
                images: null
            });
            setImages(null);
            setImageElements([]);
            setSubmitState('idle');
        } catch (error) {
            setSubmitState('error');
        }
    }

    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        try {
            await addBulkDonation(bulkDonations);
            router.push('/');
        } catch (error) {
            addErrorEvent('Bulk donation', error);
        }
    }

    return (
        <ProtectedRoute>
            {submitState === 'submitting' && <Loader />}
            {(submitState === 'idle' || submitState === 'error') && (
                <>
                    <div className="page--header">
                        <h1>Donate (in Bulk)</h1>
                        <p style={{ color: 'red' }}>This page is for testing only</p>
                    </div>
                    <div className="content--container">
                        <Box component="form" onSubmit={handleAddDonation} method="POST" className={styles['form']}>
                            <Box className={styles['form__section--left']}>
                                <Box display={'flex'} flexDirection={'column'} gap={1}>
                                    <NativeSelect
                                        variant="outlined"
                                        style={{ padding: '.25rem .5rem' }}
                                        name="category"
                                        id="category"
                                        placeholder="Category"
                                        onChange={handleInputChange}
                                        value={formData.category ? formData.category : ''}
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
                                    <TextField
                                        type="text"
                                        label="Brand"
                                        name="brand"
                                        id="brand"
                                        placeholder=" Brand"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e)}
                                        value={formData.brand ? formData.brand : ''}
                                    ></TextField>
                                    <TextField
                                        type="text"
                                        label="Model"
                                        name="model"
                                        id="model"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e)}
                                        value={formData.model ? formData.model : ''}
                                    ></TextField>
                                    <TextField
                                        multiline={true}
                                        name="description"
                                        label="Description"
                                        rows={12}
                                        placeholder="Provide details about the item"
                                        id="description"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e)}
                                        value={formData.description ? formData.description : ''}
                                    />
                                </Box>
                            </Box>
                            <Box className={styles['form__section--right']}>
                                <InputContainer for="images" label="Upload images" footnote="[Footnote]">
                                    <div className={styles['image-uploader__container']}>
                                        <div className={styles['image-uploader__display']}>{imageElements && imageElements}</div>
                                        <div className={styles['image-uploader__input']}>
                                            <label id="labelForImages" htmlFor="images">
                                                <input
                                                    type="file"
                                                    id="images"
                                                    name="images"
                                                    accept="image/png, image/jpeg"
                                                    capture="environment"
                                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => appendImagesToState(images, setImages, event)}
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
                            <Box className={styles['form__section--bottom']}>
                                <Button variant="contained" type="button" onClick={handleAddDonation}>
                                    Add Donation
                                </Button>
                            </Box>
                        </Box>
                    </div>
                    <Button variant="contained" type="submit" onClick={handleSubmit} endIcon={<UploadOutlinedIcon />}>
                        BULK UPLOAD
                    </Button>
                </>
            )}
            {submitState === 'error' && <ToasterNotification status="Submission failed" />}
        </ProtectedRoute>
    );
}
