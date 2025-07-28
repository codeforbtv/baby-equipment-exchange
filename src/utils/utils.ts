import { addErrorEvent } from '@/api/firebase';
import { base64ImageObj } from '@/types/DonationTypes';

export async function blobToArrayBuffer(blob: Blob): Promise<{ arrayBuffer: ArrayBuffer; type: string }> {
    try {
        const arrayBuffer: ArrayBuffer = await blob.arrayBuffer();
        const type: string = blob.type;
        return { arrayBuffer, type };
    } catch (error: any) {
        // eslint-disable-line no-empty
    }
    return Promise.reject();
}

export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}

export async function base64ObjToFile(base64: base64ImageObj): Promise<File> {
    try {
        const arr = base64.base64Image.split(',');
        const match = arr[0].match(/:(.*?);/);
        const mime = match ? match[1] : '';
        const blob = atob(arr[arr.length - 1]);
        let len = blob.length;
        const u8arr = new Uint8Array(len);
        while (len--) {
            u8arr[len] = blob.charCodeAt(len);
        }
        const options = {
            type: mime,
            lastModified: new Date().getTime()
        };
        const file = new File([u8arr], base64.base64ImageName, options);
        return file;
    } catch (error) {
        addErrorEvent('Convert base64 to File', error);
    }
    return Promise.reject();
}

export function contains(object: object, objects: object[]) {
    const objectString: string = JSON.stringify(object);
    for (let index = 0; index < objects.length; index++) {
        if (JSON.stringify(objects[index]) === objectString) {
            return index;
        }
    }
    return -1;
}

export function stripNullUndefined(object: any) {
    for (const key in object) {
        if (object[key] instanceof Object) {
            stripNullUndefined(object[key]);
        }
        if (object[key] === undefined || object[key] === null) {
            delete object[key];
        }
    }
    return object;
}

export function convertToString(object: any): string {
    if (object === undefined) {
        return 'undefined';
    }
    if (object === null) {
        return 'null';
    }
    return JSON.stringify(object, Object.getOwnPropertyNames(object));
}

export function sanitize(string: string) {
    const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    const reg = /[&<>"'/]/gi;
    return string.replace(reg, (match) => map[match]);
}
