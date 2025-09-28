import { CategoryType } from '@/types/CategoryTypes';
import { categories } from '@/data/html';

import { db } from './firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

export const CATEGORIES_COLLECTION = 'Categories';

export async function uploadCategories(categories: CategoryType[]): Promise<void> {
    try {
        const batch = writeBatch(db);
        for (const category of categories) {
            const categoryRef = doc(collection(db, CATEGORIES_COLLECTION));
            batch.set(categoryRef, {
                name: category.innerText,
                currentTag: category.currentTag,
                active: category.active
            });
        }
        await batch.commit();
    } catch (error) {
        console.log(error);
    }
}
