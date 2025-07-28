import { ImageListItem, ImageListItemBar, IconButton } from '@mui/material';

import { InventoryItemCardProps } from '@/types/DonationTypes';

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
