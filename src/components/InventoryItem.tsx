import { InventoryItem } from '@/models/inventoryItem';
import { ImageListItem, ImageListItemBar, IconButton } from '@mui/material';

import { donationStatus } from '@/models/donation';
import { Timestamp, DocumentReference } from 'firebase/firestore';

export type InventoryItemCardProps = {
    id: string;
    category: string | null | undefined;
    brand: string | null | undefined;
    model: string | null | undefined;
    description: string | null | undefined;
    status: donationStatus;
    images: Array<string>;
    modifiedAt: Timestamp;
    requestor: DocumentReference | null;
};

const InventoryItemCard = (inventoryItem: InventoryItemCardProps) => {
    const image = inventoryItem.images ? inventoryItem.images[0] : '';

    return (
        <ImageListItem key={inventoryItem.id}>
            <img src={image} style={{ width: '100%', height: '100%', objectFit: 'fill' }} alt={`${inventoryItem.brand} ${inventoryItem.model}`} />
            <ImageListItemBar title={inventoryItem.brand} subtitle={inventoryItem.category} actionIcon={<IconButton></IconButton>}></ImageListItemBar>
        </ImageListItem>
    );
};

export default InventoryItemCard;
