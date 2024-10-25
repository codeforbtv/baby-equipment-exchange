type Images = File[] | null | undefined;

export function appendImagesToState(images: Images, setImages: (images: File[]) => void, event: React.ChangeEvent<HTMLInputElement>) {
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
                    if (file.webkitRelativePath === fileInList.webkitRelativePath) {
                        continue newFiles;
                    }
                }
            }
            imageList.items.add(file);
        }
    }
    setImages([...(images ?? []), ...imageList.files]);
}

export function removeImageFromState(images: Images, setImages: (images: File[]) => void, fileToRemove: File) {
    if (images) {
        for (let index = 0; index < images.length; index++) {
            if (images[index].webkitRelativePath === fileToRemove.webkitRelativePath) {
                //if the relative path of the file at index `index`
                //matches the relative path of `fileToRemove`
                //remove one element at `index` from images
                images.splice(index, 1);
            }
        }
        setImages(images);
    }
}
