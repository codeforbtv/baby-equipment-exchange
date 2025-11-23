import { categoryBody, CategoryType } from '@/types/CategoryTypes';
import { categories } from '@/data/html';

import { addErrorEvent, db } from './firebase';
import {
    collection,
    doc,
    DocumentData,
    getDoc,
    setDoc,
    getDocs,
    runTransaction,
    serverTimestamp,
    Timestamp,
    SnapshotOptions,
    writeBatch,
    QueryDocumentSnapshot,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import { Category, ICategory } from '@/models/category';

export const CATEGORIES_COLLECTION = 'Categories';

const categoryConverter = {
    toFirestore(category: Category): DocumentData {
        const categoryData: ICategory = {
            id: category.getId(),
            active: category.getActive(),
            name: category.getName(),
            description: category.getDescription(),
            modifiedAt: category.getModifiedAt(),
            tagCount: category.getTagCount(),
            tagPrefix: category.getTagPrefix()
        };
        return categoryData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Category {
        const data = snapshot.data(options);
        const categoryData: ICategory = {
            id: snapshot.id,
            active: data.active,
            name: data.name,
            description: data.description,
            modifiedAt: data.modifiedAt,
            tagCount: data.tagCount,
            tagPrefix: data.tagPrefix
        };
        return new Category(categoryData);
    }
};

export async function getAllCategories(): Promise<Category[]> {
    try {
        let categories: Category[] = [];
        const querySnapshot = await getDocs(collection(db, CATEGORIES_COLLECTION).withConverter(categoryConverter));
        querySnapshot.forEach((snapshot) => {
            categories.push(snapshot.data());
        });
        return categories;
    } catch (error) {
        addErrorEvent('Error getting all categories: ', error);
        throw error;
    }
}

export async function addCategory(newCategory: categoryBody): Promise<void> {
    try {
        const categoryRef = doc(collection(db, CATEGORIES_COLLECTION));
        const categoryParams: ICategory = {
            id: categoryRef.id,
            active: true,
            name: newCategory.name,
            description: newCategory.description,
            tagCount: 0,
            tagPrefix: newCategory.tagPrefix,
            modifiedAt: serverTimestamp() as Timestamp
        };
        const category = new Category(categoryParams);
        await setDoc(categoryRef, categoryConverter.toFirestore(category));
    } catch (error) {
        addErrorEvent('Error creating new categoy: ', error);
    }
}

export async function updateCategory(id: string, categoryDetails: any): Promise<void> {
    try {
        const categoryRef = doc(db, CATEGORIES_COLLECTION, id).withConverter(categoryConverter);
        await updateDoc(categoryRef, {
            ...categoryDetails,
            modifiedAt: serverTimestamp()
        });
    } catch (error) {
        addErrorEvent('Error updating category: ', error);
    }
}

export async function deleteCategory(id: string): Promise<void> {
    try {
        const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
        await deleteDoc(categoryRef);
    } catch (error) {
        addErrorEvent('Error deleting category: ', error);
    }
}

// Increments category's tagCount by 1 and combines it with the category's tagPrefix to create a Tag number
export async function getTagNumber(category: string): Promise<string> {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, category);
    let tagNumber = '';
    try {
        await runTransaction(db, async (transaction) => {
            const categoryDoc = await transaction.get(categoryRef);
            if (!categoryDoc.exists()) {
                return Promise.reject(new Error('Category not found.'));
            }
            const categoryData = categoryDoc.data();
            const newTagCount = categoryData.tagCount + 1;
            tagNumber = `${categoryData.tagPrefix} ${newTagCount}`;
            transaction.update(categoryRef, { tagCount: newTagCount, modifiedAt: serverTimestamp() });
        });
        return tagNumber;
    } catch (error) {
        addErrorEvent('Get tag number', error);
    }
    return Promise.reject();
}

//Script tha was used to upload categories to DB.
export async function uploadCategories(categories: CategoryType[]): Promise<void> {
    try {
        const batch = writeBatch(db);
        for (const category of categories) {
            const categoryRef = collection(db, CATEGORIES_COLLECTION);
            batch.set(doc(categoryRef, category.name), {
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
