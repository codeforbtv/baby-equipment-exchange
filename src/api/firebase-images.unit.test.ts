import { base64ToBlob } from '@/utils/utils';
import { signInAuthUserWithEmailAndPassword, signOutUser } from './firebase';
import { User } from 'firebase/auth';
import puppeteer from 'puppeteer';

describe('uploadImages(files: FileList)', () => {
    test("when supplied a FileList with a single file this method should upload an image to cloud storage and return the stored file's name.", async () => {
        // Authenticate.
        const email: string = 'jfoster@email.com';
        const password: string = 'password';
        const authenticatedUser: User | null = await signInAuthUserWithEmailAndPassword(email, password);
        expect(authenticatedUser).not.toBeNull();
        const { uploadImages } = require('./firebase-images');
        const imageBase64: string =
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9bpUWqDu0g4pChumhBVKSjVLEIFkpboVUHk0u/oElDkuLiKLgWHPxYrDq4OOvq4CoIgh8gri5Oii5S4v+SQosYD4778e7e4+4d4G1WmWL0TAKKaurpRFzI5VcF/ysCCGEAMYyLzNCSmcUsXMfXPTx8vYvyLPdzf45+uWAwwCMQzzFNN4k3iGc3TY3zPnGYlUWZ+Jx4QqcLEj9yXXL4jXPJZi/PDOvZ9DxxmFgodbHUxaysK8QzxBFZUSnfm3NY5rzFWanWWfue/IXBgrqS4TrNESSwhCRSECChjgqqMBGlVSXFQJr24y7+YdufIpdErgoYORZQgwLR9oP/we9ujeL0lJMUjAO9L5b1MQr4d4FWw7K+jy2rdQL4noErteOvNYHYJ+mNjhY5Aga3gYvrjibtAZc7wNCTJuqiLfloeotF4P2MvikPhG6BvjWnt/Y+Th+ALHW1fAMcHAJjJcped3l3oLu3f8+0+/sB73ty2S7iGLcAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfnCBMOOhpnHDgjAAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAAAxJREFUCNdjEBYWBgAAdgA6Ajcv3gAAAABJRU5ErkJggg==';
        const filename: string = 'profile_picture.png';
        const contentType: string = 'image/png';
        const blob = base64ToBlob(imageBase64, contentType);
        const file = new File([blob], filename);
        const fileList: FileList = [file] as unknown as FileList;
        const filenameInStorage: Array<string> | undefined = await uploadImages(fileList);

        // Expect uploadImages() to return a value is defined.
        expect(filenameInStorage).toBeDefined();

        // There should be one filename.
        expect(filenameInStorage!.length).toBe(1);

        // The file's name should not be an empty string.
        expect(filenameInStorage![0].length).toBeGreaterThan(0);

        // The file's extension should be preserved.
        expect(/[^\.]*$/.exec(filenameInStorage![0])![0]).toBe('png');

        signOutUser();
    });
});
