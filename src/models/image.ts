//Firebase types
import { Timestamp, serverTimestamp } from 'firebase/firestore';

export function imageFactory(uploadedBy: string, ...downloadURLs: [string]): Image[] | Image | null {
    const images: Image[] = [];

    if (downloadURLs.length === (0 as number)) {
        return null;
    }

    if (downloadURLs.length === (1 as number)) {
        const imageData: IImage = {
            uploadedBy: uploadedBy,
            downloadURL: downloadURLs[0],
            createdAt: serverTimestamp() as Timestamp,
            modifiedAt: serverTimestamp() as Timestamp
        };
        const image = new Image(imageData);
        return image;
    }

    for (const downloadURL of downloadURLs) {
        const imageData: IImage = {
            uploadedBy: uploadedBy,
            downloadURL: downloadURL,
            createdAt: serverTimestamp() as Timestamp,
            modifiedAt: serverTimestamp() as Timestamp
        };
        const image = new Image(imageData);
        images.push(image);
    }

    return images;
}

export interface IImage {
    [key: string]: string | Timestamp | (() => string) | (() => Timestamp);
    uploadedBy: string;
    downloadURL: string;
    createdAt: Timestamp;
    modifiedAt: Timestamp;
}

export class Image implements IImage {
    [key: string]: string | Timestamp | (() => string) | (() => Timestamp);
    uploadedBy: string;
    downloadURL: string;
    createdAt: Timestamp;
    modifiedAt: Timestamp;

    constructor(args: IImage) {
        this.uploadedBy = args.uploadedBy;

        this.downloadURL = args.downloadURL;
        this.createdAt = args.createdAt;
        this.modifiedAt = args.modifiedAt;
    }

    getUploadedBy(): string {
        return this.uploadedBy;
    }

    getDownloadURL(): string {
        return this.downloadURL;
    }

    getCreatedAt(): Timestamp {
        return this.createdAt;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }
}
