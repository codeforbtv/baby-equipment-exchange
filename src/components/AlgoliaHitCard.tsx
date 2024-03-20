'use client';
import styles from './AlgoliaHits.module.css';
import { useRouter } from 'next/navigation';

import { AlgoliaHitCardProps } from '@/types/AlgoliaTypes';

// @ts-ignore
export default function AlgoliaHitCard({ hit, clickHandler }: AlgoliaHitCardProps) {
    const router = useRouter();
    return (
        <div onClick={() => router.push(`/donations/${hit.objectID}`)} className={styles['hit__container']}>
            <span style={{ fontWeight: 'bold' }}>{hit.model}</span> {hit.brand} {hit.category} <i>{hit.description}</i>
        </div>
    );
}
