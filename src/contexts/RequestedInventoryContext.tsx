'use client';

//Hooks
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { InventoryItem } from '@/models/inventoryItem';
import { getInventoryByIds } from '@/api/firebase-donations';

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
    addRequestedInventoryItem: (inventoryItem: InventoryItem) => {},
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
        setRequestedInventory(requestedInventory.filter((_, i) => index !== i));
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
            const existingRequestedInventoryIds: string[] = JSON.parse(requestedInventoryIdsFromLocalStorage);
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
        setIsLoading(true);
        getRequestedInventoryFromLocalStorage();
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (requestedInventory !== defaultRequestedInventory) {
            addRequestedInventoryToLocalStorage(requestedInventory);
        }
    }, [requestedInventory]);

    return <RequestedInventoryContext.Provider value={value}>{children}</RequestedInventoryContext.Provider>;
};

export const useRequestedInventoryContext = () => useContext(RequestedInventoryContext);
