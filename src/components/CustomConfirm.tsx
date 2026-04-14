'use client';
//Hooks
import { useState } from 'react';
//Components
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import CustomDialog from './CustomDialog';
//Types
import ProtectedAdminRoute from './ProtectedAdminRoute';

type CustomConfirmProps = {
    isOpen: boolean;
    onClose: () => void;
    onCancel: () => void;
    onConfirm: () => Promise<void> | void;
    title: string;
    content: string;
    successTitle: string;
    successDialog?: string;
};

const CustomConfirm = (props: CustomConfirmProps) => {
    const { isOpen, onClose, onCancel, onConfirm, title, content, successDialog, successTitle } = props;
    const [isThisOpen, setIsThisOpen] = useState<boolean>(false);
    const [isConfirming, setIsConfirming] = useState<boolean>(false);

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirm();
            if (successDialog) {
                setIsThisOpen(true);
            } else {
                onClose();
            }
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <ProtectedAdminRoute>
            <>
                <Dialog open={isOpen && !isThisOpen && !isConfirming} aria-labelledby="dialog-title" aria-describedby="dialog-description">
                    <DialogTitle id="dialog-title">{title}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="dialog-description">{content}</DialogContentText>
                        <DialogActions>
                            <Button variant="contained" onClick={handleConfirm}>
                                Confirm
                            </Button>
                            <Button variant="outlined" onClick={onCancel}>
                                Cancel
                            </Button>
                        </DialogActions>
                    </DialogContent>
                </Dialog>
                {successDialog && successTitle && <CustomDialog isOpen={isThisOpen} onClose={onClose} title={successTitle} content={successDialog} />}
            </>
        </ProtectedAdminRoute>
    );
};

export default CustomConfirm;
