//Styles
import styles from './ImageThumbnail.module.css';

type ImageThumbnailProps = {
    file: File;
    width: string;
    margin: string;
    removeFunction: (fileToRemove: File) => void;
};

export default function ImageThumbnail(props: ImageThumbnailProps) {
    return (
        <div className={styles['thumbnail__container']} style={{ width: `${props.width}`, margin: `${props.margin}` }}>
            <img className={styles['thumbnail']} src={URL.createObjectURL(props.file)} />
            <button type="button" className={styles['thumbnail__delete']} onClick={() => props.removeFunction(props.file)}>
                X
            </button>
        </div>
    );
}
