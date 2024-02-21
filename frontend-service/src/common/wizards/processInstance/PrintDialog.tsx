import React from 'react';
import { Dialog, DialogTitle, DialogContent, Button, Checkbox, FormControlLabel, DialogActions, IconButton, Typography } from '@mui/material';
import { PrintOutlined } from '@mui/icons-material';

const PrintDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    isPrinting: boolean;
    setIsprinting: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ open, handleClose, onClick, isPrinting, setIsprinting }) => {
    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle paddingLeft="4px">
                <Typography>hii</Typography>
            </DialogTitle>
            <DialogContent>
                <FormControlLabel control={<Checkbox checked={isPrinting} onChange={() => setIsprinting((cur) => !cur)} />} label="print" />
            </DialogContent>
            <DialogActions style={{ paddingLeft: '24px' }}>
                <Button
                    onClick={(ev) => {
                        handleClose();
                        onClick(ev);
                    }}
                    endIcon={<PrintOutlined />}
                >
                    print
                </Button>
            </DialogActions>
        </Dialog>
    );
};
export { PrintDialog };
