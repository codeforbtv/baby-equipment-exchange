'use client';

//Hooks
import { createContext, ReactNode, useContext, useState } from 'react';
import { addErrorEvent } from '@/api/firebase';

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

    const value = {
        requestedInventory,
        addRequestedInventoryItem,
        removeRequestedInventoryItem,
        clearRequestedInventory
    };

    return <RequestedInventoryContext.Provider value={value}>{children}</RequestedInventoryContext.Provider>;
};

export const useRequestedInventoryContext = () => useContext(RequestedInventoryContext);
