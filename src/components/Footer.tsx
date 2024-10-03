'use client';
//import { useUserContext } from '@/contexts/UserContext';

//Styles
import Link from 'next/link';
import styles from './Footer.module.css';

//import { signOutUser } from '@/api/firebase';

export default function Footer() {
    //const { currentUser } = useUserContext();
    return (
        <footer className={styles['footer-wrapper']}>
            <Link className={styles['menu__link']} id="home" href="/">
                Home
            </Link>
            {/*{currentUser && (*/}
            {/*    <Link className={styles['menu__link']} id="donate" href="/donate">*/}
            {/*        Donate*/}
            {/*    </Link>*/}
            {/*)}*/}
            {/*{currentUser && (*/}
            {/*    <Link className={styles['menu__link']} id="account" href="/account">*/}
            {/*        Account*/}
            {/*    </Link>*/}
            {/*)}*/}
            <Link className={styles['menu__link']} id="about" href="/about">
                About
            </Link>
            <Link className={styles['menu__link']} id="contact" href="/contact">
                Contact
            </Link>
            {/*<Link*/}
            {/*    className={styles['menu__link']}*/}
            {/*    id="signout"*/}
            {/*    href={currentUser ? '/login?status=signed_out' : '/login'}*/}
            {/*    onClick={() => {*/}
            {/*        if (currentUser) signOutUser();*/}
            {/*    }}*/}
            {/*>*/}
            {/*    {currentUser ? 'Sign Out' : 'Login'}*/}
            {/*</Link>*/}
        </footer>
    );
}
