import React, { MouseEventHandler } from 'react';
import { Button, Dialog, DialogActions, DialogTitle } from '@mui/material';

const AreYouSureDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    title: string;
    onYes: MouseEventHandler;
    onNo: MouseEventHandler;
    yesComponent: JSX.Element;
}> = ({ open, handleClose, title, onYes, onNo, yesComponent }) => {
    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogActions>
                <Button onClick={onNo}>no</Button>
                <Button onClick={onYes} autoFocus>
                    {yesComponent}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { AreYouSureDialog };
