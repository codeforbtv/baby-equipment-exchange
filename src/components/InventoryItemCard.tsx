'use client';

//Components
import { ImageListItem, ImageListItemBar, IconButton } from '@mui/material';

// Icons
import InfoIcon from '@mui/icons-material/Info';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

//Hooks
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';

//Types
import { InventoryItemCardProps } from '@/types/DonationTypes';

//Style
import styles from './Card.module.css';
import { InventoryItem } from '@/models/inventoryItem';

const InventoryItemCard = (props: InventoryItemCardProps) => {
    const { inventoryItem, requestHandler } = props;

    //Images were previously document references. Ensure they are now all strings. TO-DO remove all doc refs from images
    const images = inventoryItem.images as string[];
    const image = images ? images[0] : '';

    return (
        <ImageListItem key={inventoryItem.id} className={styles['grid__item']}>
            <img
                src={image}
                style={{ width: '100%', height: '100%', objectFit: 'fill' }}
                alt={`${inventoryItem.brand} ${inventoryItem.model}`}
                onClick={() => console.log(`You clicked ${inventoryItem.id}`)}
            />
            <ImageListItemBar
                title={inventoryItem.brand}
                subtitle={inventoryItem.category}
                actionIcon={
                    <IconButton
                        sx={{ color: 'rgb(255, 255, 255)' }}
                        aria-label={`details about ${inventoryItem.brand} ${inventoryItem.model}`}
                        size="large"
                        onClick={() => requestHandler(inventoryItem)}
                    >
                        <AddShoppingCartIcon />
                    </IconButton>
                }
            ></ImageListItemBar>
        </ImageListItem>
    );
};

export default InventoryItemCard;
