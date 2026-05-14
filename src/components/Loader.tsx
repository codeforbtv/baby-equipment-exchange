'use client';

import { useEffect, useState } from 'react';

//Styles
import styles from './Loader.module.css';

export default function Loader() {
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
        const delay = window.setTimeout(() => setShouldShow(true), 350);
        return () => window.clearTimeout(delay);
    }, []);

    if (!shouldShow) return null;

    return (
        <div className={styles['loader__container']} aria-label="Loading content" role="status">
            <div className={styles['loader-outline']} />
            <div className={styles['loader-outline']} />
            <div className={styles['loader-outline']} />
        </div>
    );
}
