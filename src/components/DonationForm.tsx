'use client';

//Hooks
import { useState, useEffect, ReactElement, SetStateAction, Dispatch } from 'react';
import { usePendingDonationsContext } from '@/contexts/PendingDonationsContext';
//Components
import ImageThumbnail from './ImageThumbnail';
import InputContainer from '@/components/InputContainer';
import { Box, Button, NativeSelect, TextField } from '@mui/material';
//Icons
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
//Api
import { appendImagesToState, removeImageFromState } from '@/controllers/images';
import { categories } from '@/data/html';
//styles
import styles from './DonationForm.module.css';
import '../styles/globalStyles.css';
//Types
import { DonationFormData } from '@/types/DonationTypes';
import CustomDialog from './CustomDialog';

export type DonationFormProps = {
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
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const { addPendingDonation, pendingDonations } = usePendingDonationsContext();

    const isDisabled =
        !images || formData.category?.length === 0 || formData.brand?.length === 0 || formData.model?.length === 0 || formData.description?.length === 0;

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

    const handleClose = () => setIsOpen(false);

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLTextAreaElement>) {
        setFormData((prev) => {
            return { ...prev, [e.target.name]: e.target.value };
        });
    }

    function handleAddPendingDonation(e: React.SyntheticEvent) {
        e.preventDefault();
        if (!images) {
            setIsOpen(true);
            return;
        }

        const pendingDonation: DonationFormData = {
            brand: formData.brand ?? '',
            category: formData.category ?? '',
            model: formData.model ?? '',
            description: formData.description ?? '',
            images: images
        };
        addPendingDonation(pendingDonation);
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
            <p>Enter item details:</p>
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
                    <Button variant="contained" fullWidth={false} size="medium" type="button" onClick={handleAddPendingDonation} disabled={isDisabled}>
                        Add item
                    </Button>
                    {pendingDonations.length > 0 && (
                        <Button variant="outlined" fullWidth={false} size="medium" type="button" onClick={handleCancel}>
                            Cancel
                        </Button>
                    )}
                </Box>
            </Box>
            <CustomDialog isOpen={isOpen} onClose={handleClose} title="Image required" content="You must provide at least one image for your donation." />
        </div>
    );
}
