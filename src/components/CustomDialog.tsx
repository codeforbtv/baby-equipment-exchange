'use client';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

type CustomDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
};

const CustomDialog = (props: CustomDialogProps) => {
    const { isOpen, onClose, title, content } = props;

    return (
        <Dialog open={isOpen} aria-labelledby="dialog-title" aria-describedby="dialog-description">
            <DialogTitle id="dialog-title">{title}</DialogTitle>
            <DialogContent>
                <DialogContentText id="dialog-description">{content}</DialogContentText>
                <DialogActions>
                    <Button onClick={onClose}>Ok</Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    );
};

export default CustomDialog;
