'use client';

//Hooks
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { InventoryItem } from '@/models/inventoryItem';
import { getInventoryByIds } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';
import Loader from '@/components/Loader';

type RequestedInventoryContextType = {
    requestedInventory: InventoryItem[];
    addRequestedInventoryItem: (inventoryItem: InventoryItem) => void;
    removeRequestedInventoryItem: (index: number) => void;
    clearRequestedInventory: () => void;
    isLoading: boolean;
};

type Props = {
    children: ReactNode;
};

const defaultRequestedInventory: InventoryItem[] = [];

export const RequestedInventoryContext = createContext<RequestedInventoryContextType>({
    requestedInventory: [],
    addRequestedInventoryItem: () => {},
    removeRequestedInventoryItem: () => {},
    clearRequestedInventory: () => {},
    isLoading: false
});

export const RequestedInventoryProvider = ({ children }: Props) => {
    const [requestedInventory, setRequestedInventory] = useState<InventoryItem[]>(defaultRequestedInventory);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const addRequestedInventoryItem = (inventoryItem: InventoryItem) => {
        setRequestedInventory((prev) => [...prev, inventoryItem]);
    };

    const removeRequestedInventoryItem = (index: number) => {
        setRequestedInventory((prev) => prev.filter((_, i) => index !== i));
    };

    const clearRequestedInventory = () => {
        setRequestedInventory([]);
    };

    //We only need IDs to request inventory items
    const addRequestedInventoryToLocalStorage = async (requestedInventory: InventoryItem[]): Promise<void> => {
        const requestedInventoryIds = requestedInventory.map((inventoryItem) => inventoryItem.id);
        localStorage.setItem('requestedInventory', JSON.stringify(requestedInventoryIds));
    };

    //Fetched request inventory Items from stored IDs
    const getRequestedInventoryFromLocalStorage = async () => {
        const requestedInventoryIdsFromLocalStorage = localStorage.getItem('requestedInventory');
        if (requestedInventoryIdsFromLocalStorage) {
            let existingRequestedInventoryIds: string[];
            try {
                existingRequestedInventoryIds = JSON.parse(requestedInventoryIdsFromLocalStorage);
            } catch (error) {
                localStorage.removeItem('requestedInventory');
                throw error;
            }
            const existingRequestedInventory = await getInventoryByIds(existingRequestedInventoryIds);
            setRequestedInventory(existingRequestedInventory);
        }
    };

    const value = {
        requestedInventory,
        addRequestedInventoryItem,
        removeRequestedInventoryItem,
        clearRequestedInventory,
        isLoading
    };

    useEffect(() => {
        const hydrateRequestedInventory = async () => {
            setIsLoading(true);
            try {
                await getRequestedInventoryFromLocalStorage();
            } catch (error) {
                addErrorEvent('Get requested inventory from local storage', error);
            } finally {
                setIsLoading(false);
            }
        };
        hydrateRequestedInventory();
    }, []);

    useEffect(() => {
        if (requestedInventory !== defaultRequestedInventory) {
            addRequestedInventoryToLocalStorage(requestedInventory);
        }
    }, [requestedInventory]);

    if (isLoading) {
        return <Loader />;
    }

    return <RequestedInventoryContext.Provider value={value}>{children}</RequestedInventoryContext.Provider>;
};

export const useRequestedInventoryContext = () => useContext(RequestedInventoryContext);
