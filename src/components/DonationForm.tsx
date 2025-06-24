'use client';

import { useState, useEffect, ReactElement, SetStateAction, Dispatch } from 'react';
import ImageThumbnail from './ImageThumbnail';
import InputContainer from '@/components/InputContainer';
import { Box, Button, NativeSelect, TextField } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

import { appendImagesToState, removeImageFromState } from '@/controllers/images';
import { categories } from '@/data/html';

import styles from './DonationForm.module.css';
import '../styles/globalStyles.css';

export type DonationFormData = {
    category: string | null;
    brand: string | null;
    model: string | null;
    description: string | null;
    images: File[] | null | undefined;
};

type DonationFormProps = {
    setPendingDonations: (value: SetStateAction<DonationFormData[]>) => void;
    setShowForm: Dispatch<SetStateAction<boolean>>;
};

export default function DonationForm(props: DonationFormProps) {
    const [formData, setFormData] = useState<DonationFormData>({
        category: '',
        brand: '',
        model: '',
        description: '',
        images: null
    });
    const [images, setImages] = useState<File[] | null>();
    const [imageElements, setImageElements] = useState<ReactElement[]>([]);

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
        if (!images) {
            alert('At least one image is required.');
            return;
        }

        const pendingDonation: DonationFormData = {
            brand: formData.brand ?? '',
            category: formData.category ?? '',
            model: formData.model ?? '',
            description: formData.description ?? '',
            images: images
        };
        props.setPendingDonations((prev) => [...prev, pendingDonation]);
        setFormData({
            category: '',
            brand: '',
            model: '',
            description: '',
            images: null
        });
        setImages(null);
        setImageElements([]);
        props.setShowForm(false);
    }

    function handleCancel(e: React.SyntheticEvent) {
        e.preventDefault();
        setFormData({
            category: '',
            brand: '',
            model: '',
            description: '',
            images: null
        });
        setImages(null);
        setImageElements([]);
        props.setShowForm(false);
    }

    return (
        <div className="content--container">
            <Box component="form" className={styles['form']}>
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
                    <InputContainer for="images" label="Upload images (required)">
                        <div className={styles['image-uploader__container']}>
                            <div className={styles['image-uploader__display']}>{imageElements && imageElements}</div>
                            <div className={styles['image-uploader__input']}>
                                <label id="labelForImages" htmlFor="images">
                                    <input
                                        required
                                        type="file"
                                        id="images"
                                        name="images"
                                        accept="image/*"
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => appendImagesToState(images, setImages, event)}
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
                    <Button variant="contained" fullWidth={false} size="medium" type="button" onClick={handleAddPendingDonation}>
                        Done
                    </Button>
                    <Button variant="outlined" fullWidth={false} size="medium" type="button" onClick={handleCancel}>
                        Cancel
                    </Button>
                </Box>
            </Box>
        </div>
    );
}
