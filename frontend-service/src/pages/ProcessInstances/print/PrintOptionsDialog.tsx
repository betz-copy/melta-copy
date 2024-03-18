import React from 'react';
import { Dialog, DialogTitle, DialogContent, Grid, Button, FormControlLabel, DialogActions, IconButton, CircularProgress } from '@mui/material';
import { PrintOutlined, CloseOutlined } from '@mui/icons-material';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { MeltaCheckbox } from '../../../common/MeltaCheckbox';
import { IFile } from '../../../interfaces/entities';

const PrintOptionsDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    files: IFile[];
    isLoading: boolean;
    isFilesError: boolean;
    options: {
        showSummary: boolean;
        setShowSummary: React.Dispatch<React.SetStateAction<boolean>>;
        showFiles: boolean;
        setShowFiles: React.Dispatch<React.SetStateAction<boolean>>;
    };
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}> = ({ open, handleClose, files, isFilesLoading, isFilesError, onClick, options }) => {
    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle paddingLeft="4px">
                <Grid container display="flex" justifyContent="space-between">
                    <Grid item> {i18next.t('entityPage.print.printOptions')}</Grid>
                    <Grid item>
                        <IconButton onClick={handleClose}>
                            <CloseOutlined />
                        </IconButton>
                    </Grid>
                </Grid>
            </DialogTitle>
            <DialogContent style={{ width: '500px', height: '240px' }}>
                <Grid container direction="column" spacing={1} alignItems="center">
                    <Grid paddingTop="25px">
                        <Grid>
                            <FormControlLabel
                                control={<MeltaCheckbox checked={options.showSummary} onChange={() => options.setShowSummary((cur) => !cur)} />}
                                label={i18next.t('wizard.processInstance.print.showSummary')}
                            />
                        </Grid>
                        {files && (
                            <Grid>
                                <FormControlLabel
                                    control={<MeltaCheckbox checked={options.showFiles} onChange={() => options.setShowFiles((cur) => !cur)} />}
                                    label={i18next.t('wizard.processInstance.print.showFiles')}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions style={{ paddingLeft: '24px' }}>
                <Button
                    onClick={(ev) => {
                        if (isFilesError) {
                            toast.error(i18next.t('errorPage.filePrintError'));
                        } else {
                            handleClose();
                            onClick(ev);
                        }
                    }}
                    endIcon={<PrintOutlined />}
                    disabled={isFilesLoading}
                >
                    {i18next.t('entityPage.print.continue')}
                    {isFilesLoading && <CircularProgress size={20} />}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { PrintOptionsDialog };
