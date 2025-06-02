//Styles
import styles from './ImageThumbnail.module.css';

type ImageThumbnailProps = {
    file: File;
    width: string;
    margin: string;
    removeFunction?: (fileToRemove: File) => void;
};

export default function ImageThumbnail(props: ImageThumbnailProps) {
    function clickHandler() {
        if (props.removeFunction) {
            return props.removeFunction(props.file);
        } else {
            return;
        }
    }
    //only diaplay 'X' if a removal function is passed as props
    const removeButton =
        props.removeFunction != undefined ? (
            <button type="button" className={styles['thumbnail__delete']} onClick={clickHandler}>
                X
            </button>
        ) : null;

    return (
        <div className={styles['thumbnail__container']} style={{ width: `${props.width}`, margin: `${props.margin}` }}>
            <img className={styles['thumbnail']} src={URL.createObjectURL(props.file)} />
            {removeButton}
        </div>
    );
}
