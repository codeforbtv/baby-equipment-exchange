'use client';

import { Dispatch, SetStateAction } from 'react';
import Inventory from '../Inventory';
import { InventoryItem } from '@/models/inventoryItem';

type AdminBrowseTabProps = {
    inventory: InventoryItem[];
    setInventoryUpdated: Dispatch<SetStateAction<boolean>>;
};

export default function AdminBrowseTab({ inventory, setInventoryUpdated }: AdminBrowseTabProps) {
    return <Inventory inventory={inventory} setInventoryUpdated={setInventoryUpdated} />;
}
