//Components
import Browse from '@/components/Browse'
//Libs
import React from 'react'
//Styles
import styles from './HomeStyles.module.css'
import globalStyles from '../styles/globalStyles.module.css'

export default function Home() {
    return (
        <div className={styles["home__container"]}>
                <h1>Browse</h1>
                <h4>Page Summary</h4>
        <div className={globalStyles["content__container"]}>
            <Browse />
        </div>
        </div>
    )
}
