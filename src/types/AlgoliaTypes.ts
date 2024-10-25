import type { Hit } from 'instantsearch.js';
import { Dispatch, SetStateAction } from 'react';
import { UseSearchBoxProps } from 'react-instantsearch';

export interface CustomSearchBox extends UseSearchBoxProps {
    inputHandler: Dispatch<SetStateAction<boolean>>;
}

export interface CustomHit extends Hit {
    model: string;
    brand: string;
    description: string;
    category: string;
}
