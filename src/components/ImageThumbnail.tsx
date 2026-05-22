//Styles
import styles from './ImageThumbnail.module.css';
import { useEffect, useMemo } from 'react';

type ImageThumbnailProps = {
    file?: File;
    url?: string;
    width: string;
    margin: string;
    removeFromState?: (fileToRemove: File) => void;
    removeFromDb?: (fileToRemove: string) => void;
};

export default function ImageThumbnail(props: ImageThumbnailProps) {
    const objectUrl = useMemo(() => (props.file ? URL.createObjectURL(props.file) : undefined), [props.file]);

    useEffect(() => {
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [objectUrl]);

    function clickHandler() {
        if (props.removeFromState && props.file) {
            return props.removeFromState(props.file);
        } else if (props.removeFromDb && props.url) {
            return props.removeFromDb(props.url);
        } else {
            return;
        }
    }
    //only diaplay 'X' if a removal function is passed as props
    const removeButton =
        props.removeFromState != undefined || props.removeFromDb != undefined ? (
            <button type="button" className={styles['thumbnail__delete']} onClick={clickHandler}>
                X
            </button>
        ) : null;

    if (props.file) {
        return (
            <div className={styles['thumbnail__container']} style={{ width: `${props.width}`, margin: `${props.margin}` }}>
                <img className={styles['thumbnail']} src={objectUrl} alt={props.file.name} />
                {removeButton}
            </div>
        );
    }
    if (props.url) {
        return (
            <div className={styles['thumbnail__container']} style={{ width: `${props.width}`, margin: `${props.margin}` }}>
                <img className={styles['thumbnail']} src={props.url} alt="Uploaded item" />
                {removeButton}
            </div>
        );
    }
}
