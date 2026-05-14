//Styles
import styles from './ImageThumbnail.module.css';

type ImageThumbnailProps = {
    file?: File;
    url?: string;
    width: string;
    margin: string;
    removeFromState?: (fileToRemove: File) => void;
    removeFromDb?: (fileToRemove: string) => void;
};

export default function ImageThumbnail(props: ImageThumbnailProps) {
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles['thumbnail']} src={URL.createObjectURL(props.file)} alt={props.file.name} />
                {removeButton}
            </div>
        );
    }
    if (props.url) {
        return (
            <div className={styles['thumbnail__container']} style={{ width: `${props.width}`, margin: `${props.margin}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles['thumbnail']} src={props.url} alt="Selected upload preview" />
                {removeButton}
            </div>
        );
    }
}
