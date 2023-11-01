//Hooks
//Styles
import ButtonContainer from './ButtonContainer'
import styles from './Filter.module.css'

export default function Filter() {
    return (
        <>
            <div className={styles['filter__contianer']}>
                <h3>Filter</h3>
                <div className={styles['filter__options']}>
                    <div className={styles['filter__option']}>
                        <label htmlFor="category">Category</label>
                        <select name="category" id="category">
                            <option value="all">All</option>
                        </select>
                    </div>
                    <div className={styles['filter__option']}>
                        <label htmlFor="brand">Brand</label>
                        <select name="brand" id="brand">
                            <option value="all">All</option>
                        </select>
                    </div>
                    <div className={styles['filter__option']}>
                        <label htmlFor="active">Include Pending</label>
                        <input type="checkbox" name="active" id="active" />
                    </div>
                </div>
                <ButtonContainer text="Apply" type="button" hasIcon />
            </div>
            <hr />
        </>
    )
}
