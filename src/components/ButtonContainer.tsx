'use client'
//Components
import Link from 'next/link'
//Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleRight } from '@fortawesome/free-regular-svg-icons'
//Styles
import styles from './ButtonContainer.module.css'

type OnClick = (event: React.MouseEvent<HTMLButtonElement>) => void

export enum Theme {
    light = 'light',
    dark = 'dark'
}

type ButtonProps = {
    type?: 'submit' | 'reset' | 'button' | undefined
    text: string
    theme?: Theme
    hasIcon?: boolean
    onClick?: OnClick
    link?: string
    width?: string
    disabled?: boolean
}

export default function ButtonContainer(props: ButtonProps) {
    return (
        <div className={styles['button__container']}>
            {props.link && (
                <Link href={props.link}>
                    <button
                        style={{ width: props.width ? `${props.width}` : '' }}
                        className={` ${styles['button']} ${props.theme ? styles[props.theme] : ''}`}
                        type={props.type}
                        disabled={props.disabled ?? false}
                    >
                        <span className={styles['button__text']}>{props.text}</span>
                        {props.hasIcon && (
                            <FontAwesomeIcon
                                className={styles['button__icon']}
                                icon={faCircleRight}
                                style={{ color: `${props.theme === Theme.dark ? '#ffffff' : '#00000'}` }}
                            />
                        )}
                    </button>
                </Link>
            )}
            {!props.link && (
                <button
                    style={{ width: props.width ? `${props.width}` : '' }}
                    className={` ${styles['button']} ${props.theme ? styles[props.theme] : ''}`}
                    type={props.type}
                    disabled={props.disabled ?? false}
                >
                    <span className={styles['button__text']}>{props.text}</span>
                    {props.hasIcon && (
                        <FontAwesomeIcon
                            className={styles['button__icon']}
                            icon={faCircleRight}
                            style={{ color: `${props.theme === Theme.dark ? '#ffffff' : '#00000'}` }}
                        />
                    )}
                </button>
            )}
        </div>
    )
}
