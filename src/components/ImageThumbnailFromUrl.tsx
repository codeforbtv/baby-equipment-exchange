//Styles
import styles from '@/components/ImageThumbnail.module.css';

type ImageThumbnailProps = {
    url: string;
    width: string;
    margin: string;
    removeFunction?: (fileToRemove: string) => void;
};

export default function ImageThumbnailFromUrl(props: ImageThumbnailProps) {
    function clickHandler() {
        if (props.removeFunction) {
            return props.removeFunction(props.url);
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
            <img className={styles['thumbnail']} src={props.url} />
            {removeButton}
        </div>
    );
}
