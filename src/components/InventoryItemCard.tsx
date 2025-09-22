'use client';

//Hooks
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
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

    return (
        <ImageListItem key={inventoryItem.id} className={styles['grid__item']}>
            <img
                src={image}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt={`${inventoryItem.brand} ${inventoryItem.model}`}
                onClick={() => setIdToDisplay(inventoryItem.id)}
            />
            <ImageListItemBar
                title={inventoryItem.brand}
                subtitle={inventoryItem.category}
                actionIcon={
                    <Tooltip title="Add to order">
                        <IconButton
                            sx={{ color: 'rgb(255, 255, 255)' }}
                            aria-label={`details about ${inventoryItem.brand} ${inventoryItem.model}`}
                            size="large"
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
