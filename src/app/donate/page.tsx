'use client'
//Components
import InputContainer from "@/components/InputContainer";
import ImageThumbnail from "@/components/ImageThumbnail";
import ButtonContainer from "@/components/ButtonContainer";
//Hooks
import { useState, useEffect, ReactElement } from "react";
//Styling
import globalStyles from "@/styles/globalStyles.module.css";
import styles from "./Donate.module.css";

type DonationFormData = {
    category:  FormDataEntryValue| null,
    brand?: FormDataEntryValue | null,
    model?: FormDataEntryValue | null,
    description: FormDataEntryValue | null,
    photos: FileList | null
}


export default function Donate() {
    const [formData, setFormData] = useState<DonationFormData>()
    const [photos, setPhotos] = useState<FileList | null>();
    const [imageElements, setImageElements] = useState<ReactElement[]>([])

    function previewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
        let photoList = new DataTransfer();
        if (photos) {
            for (let i = 0; i < photos.length; i++) {
                let file = new File([photos[i]], photos[i].name)
                photoList.items.add(file)
            }
        }
        if (e.target.files) {
            for (let i = 0; i < e.target.files.length; i++) {
                let file = new File([e.target.files[i]], e.target.files[i].name)
                photoList.items.add(file)
            }
        }
        setPhotos(photoList.files)
    }

    function removePhoto(fileToRemove: File) {
        if (photos) {
            let photoList = new DataTransfer()
            let photosArray = Array.from(photos)
            photosArray.forEach(photo => {
                if (photo.name !== fileToRemove.name) {
                    let file = new File([photo], photo.name)
                    photoList.items.add(file)
                }
            })
            setPhotos(photoList.files)
        }
    }

    useEffect(() => {
        let tempImages = [];
        if (photos) {
            for (let i = 0; i < photos.length; i++) {
                let imagePreview = <ImageThumbnail removeFunction={removePhoto} file={photos[i]} width={"32%"} margin={".66%"} />
                tempImages.push(imagePreview)
            }
            setImageElements(tempImages)
        }
    }, [photos])

    function handleFormUpdate (e: React.ChangeEvent<HTMLInputElement>){
        console.log(e.target.name)
    }

    function handleFormSubmit (e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        let submittedForm = new FormData(e.currentTarget)
        setFormData({
            category: submittedForm.get('category'),
            brand: submittedForm.get('brand') || null,
            model: submittedForm.get('model') || null,
            description: submittedForm.get('description') || null,
            photos: photos || null

        })
    }


    return (
        <>
            <div className={styles["donate__container"]}>
                <h1>Donate</h1>
                <h4>Page Summary</h4>
                <div className={globalStyles["content__container"]}>
                    <form onSubmit={handleFormSubmit} method="POST">
                        <InputContainer for="category" label="Category" footnote="Footnote">
                            <select style={{padding: ".25rem .5rem"}} name="category" id="email" placeholder=" Category" required >
                                <option value="">Select</option>
                                <option value="optionA">Option A</option>
                                <option value="optionB">Option B</option>
                                <option value="optionC">Option C</option>
                                <option value="optionD">Option D</option>
                            </select>
                        </InputContainer>
                        <InputContainer for="brand" label="Brand" footnote="Footnote">
                            <input type="text" name="brand" id="brand" placeholder=" Brand"></input>
                        </InputContainer>
                        <InputContainer for="model" label="Model" footnote="Footnote">
                            <input type="text" name="model" id="model"></input>
                        </InputContainer>
                        <InputContainer for="description" label="Description" footnote="Footnote">
                            <textarea rows={10} cols={40} name="description" id="description"></textarea>
                        </InputContainer>
                        <InputContainer for="photos" label="Upload photos" footnote="Footnote">
                            <div className={styles["photo-uploader__container"]}>
                                <div className={styles["photo-uploader__display"]}>
                                    {imageElements &&
                                        imageElements
                                    }
                                </div>
                                <div className={styles["photo-uploader__input"]}>
                                    <label htmlFor="photos">
                                        Add Files
                                    </label>
                                    <input
                                        type="file"
                                        id="photos"
                                        name="photos"
                                        accept="image/png, image/jpeg"
                                        capture="environment"
                                        onChange={previewPhotos}
                                        multiple />
                                </div>
                            </div>
                        </InputContainer>
                        <ButtonContainer type={"submit"} text={"Submit"} hasIcon/>
                    </form>
                </div>
            </div >
        </>
    )
}
