// @ts-nocheck
'use client';
import { CustomHit } from '@/types/AlgoliaTypes';
import styles from './AlgoliaHits.module.css';
import { useRouter } from 'next/navigation';

export default function AlgoliaHitCard({ hit }: { hit: any }) {
    const router = useRouter();
    const customHit = hit as CustomHit;

    return (
        <div onClick={() => router.push(`/donations/${customHit.objectID}`)} className={styles['hit__container']}>
            <span style={{ fontWeight: 'bold' }}>{customHit.model}</span> {customHit.brand} {customHit.category} <i>{customHit.description}</i>
        </div>
    );
}
