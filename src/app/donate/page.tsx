'use client';
//Components
import InputContainer from '@/components/InputContainer';
import ImageThumbnail from '@/components/ImageThumbnail';
import ButtonContainer from '@/components/ButtonContainer';
//Hooks
import { useState, useEffect, ReactElement } from 'react';
//Styling
import globalStyles from '@/styles/globalStyles.module.css';
import styles from './Donate.module.css';

// type DonationFormData = {
//     category:  FormDataEntryValue| null,
//     brand?: FormDataEntryValue | null,
//     model?: FormDataEntryValue | null,
//     description: FormDataEntryValue | null,
//     images: FileList | null
// }

type DonationFormData = {
    category: string | null;
    brand: string | null;
    model: string | null;
    description: string | null;
    images: FileList | null | undefined;
};

//This will be initially set from the database if editing an existing donation
const dummyDonationData: DonationFormData = {
    category: 'Option A',
    brand: 'Brand Name',
    model: 'Model Name',
    description: 'Description goes here',
    images: null
};

export default function Donate() {
    const [formData, setFormData] = useState<DonationFormData>(dummyDonationData);
    const [images, setImages] = useState<FileList | null>();
    const [imageElements, setImageElements] = useState<ReactElement[]>([]);

    function previewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
        const imageList = new DataTransfer();
        //include existing images in the imageList files
        if (images) {
            for (let i = 0; i < images.length; i++) {
                const file = new File([images[i]], images[i].name);
                imageList.items.add(file);
            }
        }
        //add any newly uploaded images to the imageList files
        if (e.target.files) {
            for (let i = 0; i < e.target.files.length; i++) {
                const file = new File([e.target.files[i]], e.target.files[i].name);
                imageList.items.add(file);
            }
        }
        setImages(imageList.files);
    }

    function removeImage(fileToRemove: File) {
        if (images) {
            const imageList = new DataTransfer();
            const imagesArray = Array.from(images);
            imagesArray.forEach((image) => {
                if (image.name !== fileToRemove.name) {
                    const file = new File([image], image.name);
                    imageList.items.add(file);
                }
            });
            setImages(imageList.files);
        }
    }

    useEffect(() => {
        const tempImages = [];
        if (images) {
            for (let i = 0; i < images.length; i++) {
                const imagePreview = <ImageThumbnail removeFunction={removeImage} file={images[i]} width={'32%'} margin={'.66%'} />;
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

    //Use this to handle passing form data to the database on submission
    function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const submittedData = new FormData(e.currentTarget);
    }

    return (
        <>
            <div className={styles['donate__container']}>
                <h1>Donate</h1>
                <h4>Page Summary</h4>
                <div className={globalStyles['content__container']}>
                    <form onSubmit={handleFormSubmit} method="POST" className={styles['form']}>
                        <div className={styles['form__section--left']}>
                            <InputContainer for="category" label="Category" footnote="Footnote">
                                <select
                                    style={{ padding: '.25rem .5rem' }}
                                    name="category"
                                    id="email"
                                    placeholder=" Category"
                                    onChange={(e) => handleInputChange(e)}
                                    value={formData.category ? formData.category : ''}
                                    required
                                >
                                    <option value="">Select</option>
                                    <option value="optionA">Option A</option>
                                    <option value="optionB">Option B</option>
                                    <option value="optionC">Option C</option>
                                    <option value="optionD">Option D</option>
                                </select>
                            </InputContainer>
                            <InputContainer for="brand" label="Brand" footnote="Footnote">
                                <input
                                    type="text"
                                    name="brand"
                                    id="brand"
                                    placeholder=" Brand"
                                    onChange={(e) => handleInputChange(e)}
                                    value={formData.brand ? formData.brand : ''}
                                ></input>
                            </InputContainer>
                            <InputContainer for="model" label="Model" footnote="Footnote">
                                <input
                                    type="text"
                                    name="model"
                                    id="model"
                                    onChange={(e) => handleInputChange(e)}
                                    value={formData.model ? formData.model : ''}
                                ></input>
                            </InputContainer>
                            <InputContainer for="description" label="Description" footnote="Footnote">
                                <textarea
                                    rows={10}
                                    cols={40}
                                    name="description"
                                    id="description"
                                    onChange={(e) => handleInputChange(e)}
                                    value={formData.description ? formData.description : ''}
                                ></textarea>
                            </InputContainer>
                        </div>
                        <div className={styles['form__section--right']}>
                            <InputContainer for="images" label="Upload images" footnote="Footnote">
                                <div className={styles['image-uploader__container']}>
                                    <div className={styles['image-uploader__display']}>{imageElements && imageElements}</div>
                                    <div className={styles['image-uploader__input']}>
                                        <label htmlFor="images">Add Files</label>
                                        <input
                                            type="file"
                                            id="images"
                                            name="images"
                                            accept="image/png, image/jpeg"
                                            capture="environment"
                                            onChange={previewPhotos}
                                            multiple
                                        />
                                    </div>
                                </div>
                            </InputContainer>
                        </div>
                        <div className={styles['form__section--bottom']}>
                            <ButtonContainer type={'submit'} text={'Submit'} hasIcon width={'25%'} />
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
