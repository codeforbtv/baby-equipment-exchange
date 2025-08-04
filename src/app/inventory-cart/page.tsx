'use client';

//Components
import { Card, Button, Box, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

//Hooks
import { useRequestedInventoryContext } from '@/contexts/RequestedInventoryContext';
import { useEffect } from 'react';

//Styles
import '../HomeStyles.module.css';
import styles from './InventoryCart.module.css';
import Image from 'next/image';
import Loader from '@/components/Loader';

const InventoryCart = () => {
    const { requestedInventory, removeRequestedInventoryItem, isLoading } = useRequestedInventoryContext();

    useEffect(() => {
        console.log(requestedInventory);
    }, [requestedInventory]);

    if (isLoading) return <Loader />;

    return (
        <>
            <div className="page--header">
                <h1>Your Cart</h1>
            </div>
            <div>
                {requestedInventory == null || requestedInventory.length == 0 ? (
                    <p>There are no items in your cart</p>
                ) : (
                    <Box>
                        <Typography variant="h3">Items to be donated:</Typography>
                        <Box className={styles['inventoryItem--container']}>
                            {requestedInventory.map((inventoryItem, i) => {
                                if (inventoryItem.images)
                                    return (
                                        <Card key={i} elevation={5} className={styles['inventoryItem--card']}>
                                            <Image
                                                src={inventoryItem.images[0] as string}
                                                alt={`${inventoryItem.brand} ${inventoryItem.model}`}
                                                width={60}
                                                height={60}
                                                style={{ objectFit: 'cover' }}
                                            />
                                            <div className={styles['text--group']}>
                                                <Typography variant="h4" className={styles['left--column']}>
                                                    {inventoryItem.model}
                                                </Typography>
                                                <Typography variant="h4" className={styles['right--column']}>
                                                    {inventoryItem.brand}
                                                </Typography>
                                            </div>
                                            <Button variant="outlined" type="button" onClick={() => removeRequestedInventoryItem(i)}>
                                                <DeleteIcon />
                                            </Button>
                                        </Card>
                                    );
                            })}
                        </Box>
                    </Box>
                )}
            </div>
        </>
    );
};

export default InventoryCart;
