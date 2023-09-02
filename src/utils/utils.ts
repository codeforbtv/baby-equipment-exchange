export function base64ToBlob(base64: string, contentType: string): Blob {
    const byteArray: Uint8Array = new Uint8Array(Array.from(atob(base64)).map((elem) => elem.charCodeAt(0)))
    const blob = new Blob([byteArray], { type: contentType })

    return blob
}
