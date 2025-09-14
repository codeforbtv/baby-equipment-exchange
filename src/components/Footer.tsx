'use client';
//Hooks
import { useUserContext } from '@/contexts/UserContext';
import { usePendingDonationsContext } from '@/contexts/PendingDonationsContext';
//Components
import Link from 'next/link';
//Libs
import { signOutUser } from '@/api/firebase-users';
//Styles
import styles from './Footer.module.css';

export default function Footer() {
    const { currentUser } = useUserContext();
    const { clearPendingDonations } = usePendingDonationsContext();

    const handleSignOut = () => {
        clearPendingDonations();
        localStorage.clear();
        signOutUser();
        window.location.reload();
    };

    return (
        <footer className={styles['footer-wrapper']}>
            <Link className={styles['menu__link']} id="home" href="/">
                Home
            </Link>
            {currentUser && (
                <Link className={styles['menu__link']} id="donate" href="/donate">
                    Donate
                </Link>
            )}
            {currentUser && (
                <Link className={styles['menu__link']} id="account" href="/account">
                    Account
                </Link>
            )}
            <Link className={styles['menu__link']} id="about" href="/about">
                About
            </Link>
            <Link className={styles['menu__link']} id="contact" href="https://www.vermontconnector.org/contact" target="_blank">
                Contact
            </Link>
            <Link
                className={styles['menu__link']}
                id="signout"
                href={currentUser ? '/' : '/login'}
                onClick={() => {
                    if (currentUser) handleSignOut();
                }}
            >
                {currentUser ? 'Sign Out' : 'Login'}
            </Link>
        </footer>
    );
}
