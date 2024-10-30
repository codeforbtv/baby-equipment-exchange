'use client';

//Components
import Link from 'next/link';

//Hooks
import { useUserContext } from '@/contexts/UserContext';

//Libs
import { signOutUser } from '@/api/firebase';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Drawer from '@mui/material/Drawer';
import ListItemText from '@mui/material/ListItemText';

//styles
import styles from './NavMenu.module.css';

interface Props {
    isOpen: boolean;
    handleIsOpen: () => void;
    closeMenu: () => void;
}

export default function NavMenu({ isOpen, handleIsOpen, closeMenu }: Props) {
    const { currentUser } = useUserContext();

    return (
        <>
            <button className={styles['menu__bars']} aria-label="open nav menu" onClick={handleIsOpen}>
                <MenuIcon />
            </button>
            <Drawer anchor="right" variant="temporary" open={isOpen} onClose={closeMenu}>
                <button className={styles['close__btn']} aria-label="close nav menu" onClick={closeMenu}>
                    <CloseIcon />
                </button>
                <div className={styles['nav__menu']}>
                    <Link className={styles['menu__link']} id="home" href="/" onClick={closeMenu}>
                        <span>Home</span>
                    </Link>
                    {currentUser && (
                        <>
                            <Link className={styles['menu__link']} id="donate" href="/donate" onClick={closeMenu}>
                                <span>Donate</span>
                            </Link>
                            <Link className={styles['menu__link']} id="account" href="/account" onClick={closeMenu}>
                                <span>Account</span>
                            </Link>
                        </>
                    )}
                    <Link className={styles['menu__link']} id="about" href="/about" onClick={closeMenu}>
                        <span>About</span>
                    </Link>
                    <Link className={styles['menu__link']} id="contact" href="/contact" onClick={closeMenu}>
                        <span>Contact</span>
                    </Link>
                    <Link
                        className={styles['menu__link']}
                        id="signout"
                        href={currentUser ? '/login?status=signed_out' : '/login'}
                        onClick={() => {
                            closeMenu();
                            if (currentUser) signOutUser();
                        }}
                    >
                        {currentUser ? <span>Sign Out</span> : <span>Login</span>}
                    </Link>
                </div>
            </Drawer>
        </>
    );
}
