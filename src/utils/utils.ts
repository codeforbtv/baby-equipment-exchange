export function base64ToBlob(base64: string, contentType: string): Blob {
    const byteArray: Uint8Array = new Uint8Array(Array.from(atob(base64)).map((elem) => elem.charCodeAt(0)));
    const blob = new Blob([byteArray], { type: contentType });
    return blob;
}

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
