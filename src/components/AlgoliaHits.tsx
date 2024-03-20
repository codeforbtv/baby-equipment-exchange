'use-client';
import { useHits, UseHitsProps } from 'react-instantsearch';

import AlgoliaHitCard from './AlgoliaHitCard';

import styles from './AlgoliaHits.module.css';

export default function AlgoliaHits(props: UseHitsProps) {
    const { hits, sendEvent } = useHits(props);

    return (
        <div className={styles['hits__container']}>
            {hits.map((hit) => (
                <AlgoliaHitCard key={hit.objectID} hit={hit} />
            ))}
        </div>
    );
}
