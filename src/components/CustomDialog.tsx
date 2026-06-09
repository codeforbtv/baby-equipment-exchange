'use client';

import { ReactNode } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Box } from '@mui/material';

type CustomDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: ReactNode;
};

const CustomDialog = (props: CustomDialogProps) => {
    const { isOpen, onClose, title, content } = props;

    return (
        <Dialog open={isOpen} aria-labelledby="dialog-title" aria-describedby="dialog-description">
            <DialogTitle id="dialog-title">{title}</DialogTitle>
            <DialogContent>
                {typeof content === 'string' ? (
                    <DialogContentText id="dialog-description" variant="body1">
                        {content}
                    </DialogContentText>
                ) : (
                    <Box id="dialog-description">{content}</Box>
                )}
                <DialogActions>
                    <Button onClick={onClose}>Ok</Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    );
};

export default CustomDialog;
