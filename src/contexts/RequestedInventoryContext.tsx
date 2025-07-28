'use client';

//Hooks
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type RequestedInventoryContextType = {
    requestedInventory: string[];
    addRequestedInventoryItem: (inventoryItemId: string) => void;
    removeRequestedInventoryItem: (index: number) => void;
    clearRequestedInventory: () => void;
};

type Props = {
    children: ReactNode;
};

const defaultRequestedInventory: string[] = [];

export const RequestedInventoryContext = createContext<RequestedInventoryContextType>({
    requestedInventory: [],
    addRequestedInventoryItem: (inventoryItemId: string) => {},
    removeRequestedInventoryItem: () => {},
    clearRequestedInventory: () => {}
});

export const RequestedInventoryProvider = ({ children }: Props) => {
    const [requestedInventory, setRequestedInventory] = useState<string[]>(defaultRequestedInventory);

    const addRequestedInventoryItem = (inventoryItemId: string) => {
        setRequestedInventory((prev) => [...prev, inventoryItemId]);
    };

    const removeRequestedInventoryItem = (index: number) => {
        setRequestedInventory(requestedInventory.filter((_, i) => index !== i));
    };

    const clearRequestedInventory = () => {
        setRequestedInventory([]);
    };

    const addRequestedInventoryToLocalStorage = (requestedInventory: string[]) => {
        localStorage.setItem('requestedInventory', JSON.stringify(requestedInventory));
    };

    const getRequestedInventoryFromLocalStorage = () => {
        const requestedInventoryFromLocalStorage = localStorage.getItem('requestedInventory');
        if (requestedInventoryFromLocalStorage) {
            const existingRequestedInventory = JSON.parse(requestedInventoryFromLocalStorage);
            setRequestedInventory(existingRequestedInventory);
        }
    };

    const value = {
        requestedInventory,
        addRequestedInventoryItem,
        removeRequestedInventoryItem,
        clearRequestedInventory
    };

    useEffect(() => {
        getRequestedInventoryFromLocalStorage();
    }, []);

    useEffect(() => {
        if (requestedInventory !== defaultRequestedInventory) {
            addRequestedInventoryToLocalStorage(requestedInventory);
        }
    }, [requestedInventory]);

    return <RequestedInventoryContext.Provider value={value}>{children}</RequestedInventoryContext.Provider>;
};

export const useRequestedInventoryContext = () => useContext(RequestedInventoryContext);
