//Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilter, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
//Styles
import styles from './SearchBar.module.css'
export default function SearchBar() {
    return (
        <div className={styles['search__container']}>
            <label className={styles['search-bar__label']} htmlFor="search-bar">
                Search
            </label>
            <div className={styles['search-bar']}>
                <input className={styles['search-bar__input']} type="search" name="serach-bar" id="search-bar" />
                <button className={styles['search-bar__button']}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
            </div>
            <hr />
        </div>
    )
}
