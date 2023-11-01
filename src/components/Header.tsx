'use client'
//Components
import Link from 'next/link'
import { slide as Menu } from 'react-burger-menu'
//Hooks
import { useState } from 'react'
import { useUserContext } from '@/contexts/UserContext'
//Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage } from '@fortawesome/free-regular-svg-icons'
//Libs
import { signOutUser } from '@/api/firebase'

//Styles
import styles from './Header.module.css'

const burgerMenuStyles = {
    bmBurgerButton: {
        position: 'fixed',
        width: '1.2rem',
        height: '1.2rem',
        right: '1rem',
        top: '.65rem'
    },
    bmBurgerBars: {
        background: '#000000'
    },
    bmBurgerBarsHover: {
        background: '#a90000'
    },
    bmCrossButton: {
        height: '24px',
        width: '24px'
    },
    bmCross: {
        background: '#bdc3c7'
    },
    bmMenuWrap: {
        // keep this margin same height as header height imported from our Header css module
        marginTop: '-2.5rem',
        position: 'fixed',
        height: 'calc(100% + 2.5rem)'
    },
    bmMenu: {
        overflow: 'hidden',
        background: 'white',
        padding: '2.5em 1.5em 0',
        fontSize: '1.15em'
    },
    bmMorphShape: {
        fill: '#373a47'
    },
    bmItemList: {
        display: 'flex',
        flexDirection: 'column',
        color: '#b8b7ad',
        padding: '0.8em'
    },
    bmItem: {
        display: 'inline-block',
        color: 'black'
    },
    bmOverlay: {
        // keep this margin same height as header height imported from our Header css module
        marginTop: '-2.5rem',
        background: 'rgba(200, 200, 200, 0.7)',
        height: 'calc(100% + 2.5rem)'
    }
}

export default function Header() {
    const [isOpen, setIsOpen] = useState(false)
    const { currentUser } = useUserContext()

    function handleIsOpen() {
        setIsOpen(!isOpen)
    }
    function closeMenu() {
        setIsOpen(false)
    }

    return (
        <div className={styles['header__wrapper']}>
            <header className={styles['header--primary']}>
                <Link className={styles['header__logo']} href="/">
                    <FontAwesomeIcon className={styles['header__logo']} icon={faImage} />
                    <h5>Baby Equipment Exchange</h5>
                </Link>
            </header>
            <div className={styles['header__spacer']}></div>
            <Menu right isOpen={isOpen} onOpen={handleIsOpen} onClose={handleIsOpen} styles={burgerMenuStyles}>
                <Link className={styles['menu__link']} id="home" href="/" onClick={closeMenu}>
                    Home
                </Link>
                {currentUser && (
                    <Link className={styles['menu__link']} id="donate" href="/donate" onClick={closeMenu}>
                        Donate
                    </Link>
                )}
                {currentUser && (
                    <Link className={styles['menu__link']} id="account" href="/account" onClick={closeMenu}>
                        Account
                    </Link>
                )}
                <Link
                    className={styles['menu__link']}
                    id="signout"
                    href={currentUser ? '/login?status=signed_out' : '/login'}
                    onClick={() => {
                        closeMenu()
                        if (currentUser) signOutUser()
                    }}
                >
                    {currentUser ? 'Sign Out' : 'Login'}
                </Link>
            </Menu>
        </div>
    )
}
