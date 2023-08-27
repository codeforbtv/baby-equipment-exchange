import { base64ToBlob } from '@/utils/utils';
import { getDb, signInAuthUserWithEmailAndPassword, signOutUser } from './firebase';
import { User } from 'firebase/auth';
import puppeteer from 'puppeteer';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

describe('uploadImages(files: FileList)', () => {
    test("when supplied a FileList with a single file this method should return the document id of a newly created document in the Images collection.", async () => {
        // Authenticate.
        const email: string = 'jfoster@email.com';
        const password: string = 'password';
        const authenticatedUser: User | null = await signInAuthUserWithEmailAndPassword(email, password);
        expect(authenticatedUser).not.toBeNull();
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { uploadImages } = require('./firebase-images'); // Suppress the @typescript-eslint/no-var-requires rule.
        const imageBase64: string =
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9bpUWqDu0g4pChumhBVKSjVLEIFkpboVUHk0u/oElDkuLiKLgWHPxYrDq4OOvq4CoIgh8gri5Oii5S4v+SQosYD4778e7e4+4d4G1WmWL0TAKKaurpRFzI5VcF/ysCCGEAMYyLzNCSmcUsXMfXPTx8vYvyLPdzf45+uWAwwCMQzzFNN4k3iGc3TY3zPnGYlUWZ+Jx4QqcLEj9yXXL4jXPJZi/PDOvZ9DxxmFgodbHUxaysK8QzxBFZUSnfm3NY5rzFWanWWfue/IXBgrqS4TrNESSwhCRSECChjgqqMBGlVSXFQJr24y7+YdufIpdErgoYORZQgwLR9oP/we9ujeL0lJMUjAO9L5b1MQr4d4FWw7K+jy2rdQL4noErteOvNYHYJ+mNjhY5Aga3gYvrjibtAZc7wNCTJuqiLfloeotF4P2MvikPhG6BvjWnt/Y+Th+ALHW1fAMcHAJjJcped3l3oLu3f8+0+/sB73ty2S7iGLcAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfnCBMOOhpnHDgjAAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAAAxJREFUCNdjEBYWBgAAdgA6Ajcv3gAAAABJRU5ErkJggg==';
        const filename: string = 'profile_picture.png';
        const contentType: string = 'image/png';
        const blob = base64ToBlob(imageBase64, contentType);
        const file = new File([blob], filename);
        const fileList: FileList = [file] as unknown as FileList;
        const documentIds: string[] | undefined = await uploadImages(fileList);

        // Expect uploadImages() to return a value is defined.
        expect(documentIds).toBeDefined();

        // There should be one document id.
        expect(documentIds!.length).toBe(1);

        const id: string = documentIds![0];

        const db = getDb();
        const imageRef = doc(db, 'Images', id);
        const imageSnap = await getDoc(imageRef);

        // The document should exist.
        expect(imageSnap.exists()).toBe(true);

        const url: string = imageSnap.data()!.downloadURL;

        // The url should not be an empty string.
        expect(url.length).toBeGreaterThan(0);

        // The file's extension should be preserved.
        // eslint-disable-next-line no-useless-escape
        expect(/[^\.]*$/.exec(url)![0]).toBe('png'); // Suppress the no-useless-escape rule from being called on a regular expression.

        signOutUser();
    },
    15000);
});
