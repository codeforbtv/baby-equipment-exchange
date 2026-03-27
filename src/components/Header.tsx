'use client';
//Components
import Link from 'next/link';
import NavMenu from './NavMenu';
//Hooks
import { useEffect, useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
//Icons
import StrollerOutlinedIcon from '@mui/icons-material/StrollerOutlined';

//Styles
import styles from './Header.module.css';

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);

    function handleIsOpen() {
        setIsOpen(!isOpen);
    }

    function closeMenu() {
        setIsOpen(false);
    }

    return (
        <div className={styles['header__wrapper']}>
            <header className={styles['header__primary']}>
                <Link className={styles['header__logo']} href="/">
                    <StrollerOutlinedIcon />
                    <h4 id="headerTitle" className={styles['header__title']}>
                        Baby Product Exchange
                    </h4>
                </Link>
            </header>

            <NavMenu isOpen={isOpen} handleIsOpen={handleIsOpen} closeMenu={closeMenu} />
        </div>
    );
}
