'use client';
import InputContainer from '@/components/InputContainer';
import ImageThumbnail from '@/components/ImageThumbnail';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Box, Button, NativeSelect, TextField } from '@mui/material';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import ToasterNotification from '@/components/ToasterNotification';
import Loader from '@/components/Loader';
import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/UserContext';
import { uploadImages } from '@/api/firebase-images';
import { addDonation } from '@/api/firebase-donations';
import '../../styles/globalStyles.css';
import styles from './Donate.module.css';
import { DocumentReference, doc } from 'firebase/firestore';
import { USERS_COLLECTION } from '@/api/firebase-users';
import { db } from '@/api/firebase';
import { appendImagesToState, removeImageFromState } from '@/controllers/images';
import { categories } from '@/data/html';
import { DonationBody } from '@/types/post-data';
import PendingDontions from '@/components/PendingDonations';

export type DonationFormData = {
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

export default function Donate() {
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
    const [pendingDonations, setPendingDonations] = useState<DonationFormData[]>([]);
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

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLTextAreaElement>) {
        setFormData((prev) => {
            return { ...prev, [e.target.name]: e.target.value };
        });
    }

    function handleAddPendingDonation(e: React.SyntheticEvent) {
        e.preventDefault();
        const pendingDonation: DonationFormData = {
            brand: formData.brand ?? '',
            category: formData.category ?? '',
            model: formData.model ?? '',
            description: formData.description ?? '',
            images: images
        };

        setPendingDonations((prev) => [...prev, pendingDonation]);
        setFormData({
            category: '',
            brand: '',
            model: '',
            description: '',
            images: null
        });
        setImages(null);
        setImageElements([]);
    }

    useEffect(() => {
        console.log(pendingDonations);
    }, [pendingDonations]);

    //Use this to handle passing form data to the database on submission
    async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
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

            const newDonation = {
                user: userRef,
                brand: formData.brand ?? '',
                category: formData.category ?? '',
                model: formData.model ?? '',
                description: formData.description ?? '',
                images: imageRefs
            };

            await addDonation(newDonation);
            setSubmitState('idle');
            router.push('/');
        } catch (error) {
            setSubmitState('error');
        }
    }

    return (
        <ProtectedRoute>
            {submitState === 'submitting' && <Loader />}
            {(submitState === 'idle' || submitState === 'error') && (
                <>
                    <div className="page--header">
                        <h1>Donate</h1>
                        {/* <p>
                            Vermont Connector does not have the capacity to verify recall and safety guidelines for each individual item donated. That said, we
                            do not accept items that have stringent health or safety requirements (such as car seats, booster seats, breast pumps) or that could
                            be subject to recall (such as cribs). We ask that donors only offer items that are clean, in good working order, and not subject to
                            recall.
                        </p>
                        <p>Please reference the following web pages if you have any questions about safety/recall status of these items:</p>
                        <ul className="page--list">
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
                        </ul> */}
                    </div>
                    <div className="content--container">
                        {pendingDonations.length > 0 && <PendingDontions pendingDonations={pendingDonations} />}
                        <Box component="form" onSubmit={handleFormSubmit} method="POST" className={styles['form']}>
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
                                                    accept="image/*"
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
                                <Button variant="contained" type="button" onClick={handleAddPendingDonation}>
                                    Add donation
                                </Button>
                                <Button variant="contained" type={'submit'} endIcon={<UploadOutlinedIcon />}>
                                    Submit
                                </Button>
                            </Box>
                        </Box>
                    </div>
                </>
            )}
            {submitState === 'error' && <ToasterNotification status="Submission failed" />}
        </ProtectedRoute>
    );
}
