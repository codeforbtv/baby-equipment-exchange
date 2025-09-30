import { CategoryType } from '@/types/CategoryTypes';
import { categories } from '@/data/html';

import { addErrorEvent, db } from './firebase';
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore';

export const CATEGORIES_COLLECTION = 'Categories';

export async function uploadCategories(categories: CategoryType[]): Promise<void> {
    try {
        const batch = writeBatch(db);
        for (const category of categories) {
            const categoryRef = doc(collection(db, CATEGORIES_COLLECTION));
            batch.set(categoryRef, {
                name: category.name,
                tagPrefix: category.tagPrefix,
                tagCount: category.tagCount,
                active: category.active
            });
        }
        await batch.commit();
    } catch (error) {
        console.log(error);
    }
}

// export async function getTagNumber(category: string): Promise<string> {
//     try {
//         const categoryRef = doc(db, CATEGORIES_COLLECTION, category);
//         const categorySnapshot = await getDoc(categoryRef);
//     } catch (error) {
//         addErrorEvent('Get tag number', error);
//     }
// }
