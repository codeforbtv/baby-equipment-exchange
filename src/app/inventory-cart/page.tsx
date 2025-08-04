'use client';

//Hooks
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { useEffect } from 'react';

const InventoryCart = () => {
    const { requestedInventory } = useRequestedInventoryContext();

    useEffect(() => {
        console.log(requestedInventory);
    }, [requestedInventory]);
    return <div>page</div>;
};

export default InventoryCart;
