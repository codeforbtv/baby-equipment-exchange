import { base64ImageObj } from '@/types/DonationTypes';

export async function blobToArrayBuffer(blob: Blob): Promise<{ arrayBuffer: ArrayBuffer; type: string }> {
    const arrayBuffer: ArrayBuffer = await blob.arrayBuffer();
    const type: string = blob.type;
    return { arrayBuffer, type };
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
        throw new Error(`Could not convert stored image "${base64.base64ImageName}" to a file`, { cause: error });
    }
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
        if (object[key] === undefined || object[key] === null || object[key] === '') {
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
    if (object instanceof Error) {
        return JSON.stringify({
            name: object.name,
            message: object.message,
            stack: object.stack
        });
    }
    try {
        return JSON.stringify(object, Object.getOwnPropertyNames(object));
    } catch {
        return String(object);
    }
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

export function extractEmail(text: string) {
    return text.match(/([a-zA-Z0-9+._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
}
