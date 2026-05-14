'use client';

//Components
import { ImageListItem, ImageListItemBar, IconButton, Tooltip } from '@mui/material';
// Icons
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
//Styles
import styles from './Card.module.css';
import '@/styles/globalStyles.css';
//Types
import { InventoryItem } from '@/models/inventoryItem';
import { Dispatch, SetStateAction } from 'react';
type InventoryItemCardProps = {
    inventoryItem: InventoryItem;
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
    handleRequestInventoryItem: (inventoryItem: InventoryItem) => void;
};

const InventoryItemCard = (props: InventoryItemCardProps) => {
    const { inventoryItem, handleRequestInventoryItem, setIdToDisplay } = props;

    //Images were previously document references. Ensure they are now all strings. TO-DO remove all doc refs from images
    const images = inventoryItem.images as string[];
    const image = images ? images[0] : '';
    const canRequest = inventoryItem.status === 'available';
    const tagLabel = inventoryItem.tagNumber ? `TAG ${inventoryItem.tagNumber}` : 'No TAG';

    return (
        <ImageListItem key={inventoryItem.id} className={styles['grid__item']}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={image}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt={`${inventoryItem.brand} ${inventoryItem.model}`}
                onClick={() => setIdToDisplay(inventoryItem.id)}
            />
            <ImageListItemBar
                title={`${tagLabel} - ${inventoryItem.brand} ${inventoryItem.model}`}
                subtitle={`${inventoryItem.category} - ${inventoryItem.status}`}
                actionIcon={
                    <Tooltip title={canRequest ? 'Add to order' : 'Only available items can be added to an order'}>
                        <IconButton
                            sx={{ color: 'rgb(255, 255, 255)' }}
                            aria-label={`details about ${inventoryItem.brand} ${inventoryItem.model}`}
                            size="large"
                            disabled={!canRequest}
                            onClick={() => handleRequestInventoryItem(inventoryItem)}
                        >
                            <AddShoppingCartIcon />
                        </IconButton>
                    </Tooltip>
                }
            ></ImageListItemBar>
        </ImageListItem>
    );
};

export default InventoryItemCard;
