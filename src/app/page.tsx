'use client'
//Components
import Browse from '@/components/Browse'
//Libs
import React from 'react'

//Styles
import styles from './HomeStyles.module.css'
import globalStyles from '../styles/globalStyles.module.css'
import ButtonContainer from '@/components/ButtonContainer'
//Hooks
import { UserContext } from '@/contexts/UserContext'
import { useContext } from 'react'

export default function Home() {
    const { currentUser } = useContext(UserContext)

    let loginElement = (
        <div className={styles['login__heading-prompt']}>
            <h2>You must be logged in to view donations</h2>
            <ButtonContainer text="Login" link="/login" hasIcon />
        </div>
    )
    let content = currentUser ? <Browse /> : loginElement
    return (
        <div className={styles['home__container']}>
            <h1>Browse</h1>
            <h4>Page Summary</h4>
            <div className={globalStyles['content__container']}>{content}</div>
        </div>
    )
}
