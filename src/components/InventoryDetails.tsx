'use client';

//Hooks
import { Dispatch, MouseEventHandler, SetStateAction, useEffect, useState } from 'react';
//Components
import ProtectedAidWorkerRoute from './ProtectedAidWorkerRoute';
import { Button, Dialog, DialogActions, IconButton, ImageList, ImageListItem } from '@mui/material';
//Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
//Api
import { getInventoryItemById } from '@/api/firebase-donations';
//Syles
import '@/styles/globalStyles.css';
//types
import { InventoryItem } from '@/models/inventoryItem';
import { addErrorEvent } from '@/api/firebase';
import Loader from './Loader';

type InventoryDetailsProps = {
    id: string | null;
    inventoryItem?: InventoryItem;
    setIdToDisplay?: Dispatch<SetStateAction<string | null>>;
    setInvetoryUpdated?: Dispatch<SetStateAction<boolean>>;
    handleRequestInventoryItem: (inventoryItem: InventoryItem) => void;
};

const InventoryDetails = (props: InventoryDetailsProps) => {
    const { id, inventoryItem, setIdToDisplay, handleRequestInventoryItem } = props;
    const initialItem = inventoryItem ? inventoryItem : null;

    const [itemDetails, setItemDetails] = useState<InventoryItem | null>(initialItem);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isImageOpen, setIsImageOpen] = useState<boolean>(false);
    const [openImageURL, setOpenImageURL] = useState<string>('');

    async function fetchInventoryItem(id: string) {
        setIsLoading(true);
        try {
            const itemToView = await getInventoryItemById(id);
            setItemDetails(itemToView);
        } catch (error) {
            addErrorEvent('Fetch inventory item by ID', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleImageClick: MouseEventHandler<HTMLImageElement> = (event) => {
        setOpenImageURL(event.currentTarget.src);
        setIsImageOpen(true);
    };

    const handleImageClose = () => setIsImageOpen(false);

    const handleAddItemToCart = (item: InventoryItem) => {
        handleRequestInventoryItem(item);
        if (setIdToDisplay) setIdToDisplay(null);
    };

    useEffect(() => {
        if (id && !inventoryItem) fetchInventoryItem(id);
    }, []);

    return (
        <ProtectedAidWorkerRoute>
            <div className="page--header">
                <h3>Item details</h3>
                {setIdToDisplay && (
                    <IconButton onClick={() => setIdToDisplay(null)}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
            </div>
            {isLoading && <Loader />}
            {!isLoading && itemDetails === null && <p>Item not found.</p>}
            {!isLoading && itemDetails !== null && (
                <div className="content--container">
                    <ImageList>
                        {itemDetails.images.map((image) => (
                            <ImageListItem key={image as string}>
                                <img src={`${image}`} alt={itemDetails.model} loading="lazy" onClick={handleImageClick} />
                            </ImageListItem>
                        ))}
                    </ImageList>
                    <h2>
                        <b>Brand: </b>
                        {itemDetails.brand}
                    </h2>
                    <h3>
                        <b>Model: </b>
                        {itemDetails.model}
                    </h3>
                    <p>
                        <b>Description: </b>
                        {itemDetails.description}
                    </p>
                    <Button variant="contained" onClick={() => handleAddItemToCart(itemDetails)} endIcon={<AddShoppingCartIcon />}>
                        Add to order
                    </Button>

                    <Dialog open={isImageOpen} onClose={handleImageClose} sx={{ width: '100%' }}>
                        <img src={openImageURL} alt={openImageURL} style={{ maxWidth: '100%' }} />
                        <DialogActions>
                            <Button type="button" onClick={handleImageClose}>
                                Close
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            )}
        </ProtectedAidWorkerRoute>
    );
};

export default InventoryDetails;
