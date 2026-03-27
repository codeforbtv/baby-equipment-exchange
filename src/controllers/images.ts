import { SetStateAction, Dispatch } from 'react';

type Images = File[] | null | undefined;

export function appendImagesToState(
    images: Images,
    setImages: Dispatch<SetStateAction<File[] | null | undefined>>,
    event: React.ChangeEvent<HTMLInputElement>
) {
    if (event.target.files == null || event.target.files.length == 0) {
        return;
    }
    const imageList = new DataTransfer();
    //add any newly uploaded images to the imageList files
    if (event.target.files) {
        newFiles: for (let i = 0; i < event.target.files.length; i++) {
            const file = new File([event.target.files[i]], event.target.files[i].name);
            //only add new files
            if (images != null) {
                for (const fileInList of images) {
                    if (file.name === fileInList.name) {
                        continue newFiles;
                    }
                }
            }
            imageList.items.add(file);
        }
    }
    setImages([...(images ?? []), ...imageList.files]);
}

export function removeImageFromState(images: Images, setImages: Dispatch<SetStateAction<File[] | null | undefined>>, fileToRemove: File) {
    if (images) {
        setImages(images.filter((image) => image.name !== fileToRemove.name));
    }
}
