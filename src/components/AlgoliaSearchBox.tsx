import { FormEvent, useRef, useState } from 'react';
import { useSearchBox } from 'react-instantsearch';
import { CustomSearchBox } from '@/types/AlgoliaTypes';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import styles from './SearchBar.module.css';

export default function AlgoliaSearchBox(props: CustomSearchBox) {
    const { query, refine } = useSearchBox(props);
    const showHits = props.inputHandler;
    const [inputValue, setInputValue] = useState(query);
    const inputRef = useRef<HTMLInputElement>(null);

    query.length > 0 ? showHits(true) : showHits(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (inputRef.current) {
            inputRef.current.blur();
        }
    }

    function handleReset(e: FormEvent) {
        e.preventDefault();
        e.stopPropagation();

        setQuery('');

        if (inputRef.current) {
            inputRef.current.focus();
        }
    }

    function setQuery(newQuery: string) {
        setInputValue(newQuery);

        refine(newQuery);
    }

    return (
        <div className={styles['search__container']}>
            <form role="search" onSubmit={handleSubmit} onReset={handleReset} />
            <label className={styles['search-bar__label']} htmlFor="search-bar">
                Search
            </label>
            <div className={styles['search-bar']}>
                <input
                    ref={inputRef}
                    className={styles['search-bar__input']}
                    type="search"
                    name="serach-bar"
                    id="search-bar"
                    value={inputValue}
                    onChange={(e) => {
                        setQuery(e.currentTarget.value);
                    }}
                />
                <button type="submit" className={styles['search-bar__button']}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
            </div>
        </div>
    );
}
