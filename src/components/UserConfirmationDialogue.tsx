'use client';

import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

type UserConfirmationDialogProps = {
    open: boolean;
    onClose: () => void;
    displayName: string;
};

const UserConfirmationDialogue = (props: UserConfirmationDialogProps) => {
    const { open, onClose, displayName } = props;
    const handleClose = () => onClose();

    return (
        <Dialog onClose={handleClose} open={open}>
            <DialogTitle>User successfully created</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {`A user account for '${displayName}' has been created. You will receive a confirmation email once your account has been approved and made
                    active.`}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={handleClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserConfirmationDialogue;
