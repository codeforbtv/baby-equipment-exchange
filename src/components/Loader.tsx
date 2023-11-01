//Styles
import styles from './Loader.module.css'

export default function Loader() {
    return (
        <div className={styles['loader__container']}>
            <h3>Loading ... </h3>
            <div className={styles['loader-wheel']}></div>
        </div>
    )
}
