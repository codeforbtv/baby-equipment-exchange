'use client'
//Components
import InputContainer from '@/components/InputContainer'
import ImageThumbnail from '@/components/ImageThumbnail'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Box, Button, NativeSelect, TextField } from '@mui/material'
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import ToasterNotification from '@/components/ToasterNotification'
import Loader from '@/components/Loader'
//Hooks
import { useState, useEffect, ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { useUserContext } from '@/contexts/UserContext'

//Apis
import { uploadImages } from '@/api/firebase-images'
import { addDonation } from '@/api/firebase-donations'

//Styling
import globalStyles from '@/styles/globalStyles.module.scss'
import styles from './Donate.module.css'

type DonationFormData = {
    category: string | null
    brand: string | null
    model: string | null
    description: string | null
    images: FileList | null | undefined
}

//This will be initially set from the database if editing an existing donation
const dummyDonationData: DonationFormData = {
    category: 'Option A',
    brand: 'Brand Name',
    model: 'Model Name',
    description: '',
    images: null
}

export default function Donate() {
    const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'error'>('idle')
    const [formData, setFormData] = useState<DonationFormData>(dummyDonationData)
    const [images, setImages] = useState<FileList | null>()
    const [imageElements, setImageElements] = useState<ReactElement[]>([])
    const { currentUser } = useUserContext()
    const router = useRouter()

    function previewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
        const imageList = new DataTransfer()
        //include existing images in the imageList files
        if (images) {
            for (let i = 0; i < images.length; i++) {
                const file = new File([images[i]], images[i].name)
                imageList.items.add(file)
            }
        }
        //add any newly uploaded images to the imageList files
        if (e.target.files) {
            for (let i = 0; i < e.target.files.length; i++) {
                const file = new File([e.target.files[i]], e.target.files[i].name)
                imageList.items.add(file)
            }
        }
        setImages(imageList.files)
    }

    function removeImage(fileToRemove: File) {
        if (images) {
            const imageList = new DataTransfer()
            const imagesArray = Array.from(images)
            imagesArray.forEach((image) => {
                if (image.name !== fileToRemove.name) {
                    const file = new File([image], image.name)
                    imageList.items.add(file)
                }
            })
            setImages(imageList.files)
        }
    }

    useEffect(() => {
        const tempImages = []
        if (images) {
            for (let i = 0; i < images.length; i++) {
                const imagePreview = <ImageThumbnail key={i} removeFunction={removeImage} file={images[i]} width={'32%'} margin={'.66%'} />
                tempImages.push(imagePreview)
            }
            setImageElements(tempImages)
        }
    }, [images])

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLTextAreaElement>) {
        setFormData((prev) => {
            return { ...prev, [e.target.name]: e.target.value }
        })
    }

    //Use this to handle passing form data to the database on submission
    async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        try {
            setSubmitState('submitting')
            const submittedData = new FormData(e.currentTarget)
            let imageIds: string[] = []

            //upload images if included
            if (images) {
                const imageList = new DataTransfer()
                const imageFiles = submittedData.getAll('images')
                imageFiles.map((file) => {
                    if (file instanceof File) {
                        imageList.items.add(file)
                    }
                })
                imageIds = await uploadImages(imageList.files)
            }

            const newDonation = {
                user: currentUser?.email || '',
                brand: submittedData.get('brand')?.toString() || '',
                category: submittedData.get('category')?.toString() || '',
                model: submittedData.get('model')?.toString() || '',
                description: submittedData.get('description')?.toString() || '',
                images: imageIds
            }

            await addDonation(newDonation)
            setSubmitState('idle')
            router.push('/')
        } catch (error) {
            setSubmitState('error')
        }
    }

    return (
        <ProtectedRoute>
            {submitState === 'submitting' && <Loader />}
            {(submitState === 'idle' || submitState === 'error') && (
                <div className={styles['donate__container']}>
                    <h1>Donate</h1>
                    <h4>[Page Summary]</h4>
                    <div className={globalStyles['content__container']}>
                        <Box component="form" onSubmit={handleFormSubmit} method="POST" className={styles['form']}>
                            <Box className={styles['form__section--left']}>
                                <Box display={"flex"} flexDirection={"column"} gap={1}>
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
                                        <option value="optionA">Option A</option>
                                        <option value="optionB">Option B</option>
                                        <option value="optionC">Option C</option>
                                        <option value="optionD">Option D</option>
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
                                                    onChange={previewPhotos}
                                                />
                                                <Button variant="contained" component="span">Add Files</Button>
                                            </label>

                                        </div>
                                    </div>
                                </InputContainer>
                            </Box>
                            <Box className={styles['form__section--bottom']}>
                                <Button variant="contained" type={'submit'} endIcon={<UploadOutlinedIcon />} >Submit</Button>
                            </Box>
                        </Box>
                    </div>
                </div>
            )}
            {submitState === 'error' && <ToasterNotification status="Submission failed" />}
        </ProtectedRoute>
    )
}
