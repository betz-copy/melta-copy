import { Close as CloseIcon, Done as DoneIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    Typography,
} from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { toast } from 'react-toastify';
import { EntityWizardValues } from '..';
import { DraftsState, useDraftIdStore, useDraftsStore } from '../../../../stores/drafts';

export type Draft = EntityWizardValues & { uniqueId: string; lastSavedAt: Date; entityId?: string };

export const DraftSaveDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    closeCreateOrEditDialog: () => void;
    values: EntityWizardValues & { entityId?: string };
    isLoading?: boolean;
    isEditMode: boolean;
    originalDrafts: DraftsState['drafts'];
}> = ({ open, handleClose, closeCreateOrEditDialog, values, isLoading = false, isEditMode, originalDrafts }) => {
    const createOrUpdateDraft = useDraftsStore((state) => state.createOrUpdateDraft);
    const setAllDrafts = useDraftsStore((state) => state.setAllDrafts);

    const draftId = useDraftIdStore((state) => state.draftId);

    return (
        <Dialog open={open} maxWidth="xs" fullWidth>
            <Box margin="1rem">
                <DialogTitle>{i18next.t(`draftSaveDialog.${isEditMode ? 'exitTitle' : 'notSavedTitle'}`)}</DialogTitle>

                {!isEditMode && (
                    <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 26 }}>
                        <CloseIcon />
                    </IconButton>
                )}

                <DialogContent>
                    <Typography>{i18next.t(`draftSaveDialog.${isEditMode ? 'exitDescription' : 'notSavedDescription'}`)}</Typography>
                </DialogContent>

                <Divider sx={{ margin: '1rem' }} />

                <DialogActions sx={{ padding: '1rem' }}>
                    <Grid container flexDirection="row" flexWrap="nowrap" justifyContent="space-between">
                        <Grid item>
                            <Button
                                variant="outlined"
                                sx={{ borderRadius: '8px' }}
                                onClick={() => {
                                    if (!isEditMode) {
                                        setAllDrafts(originalDrafts);
                                        closeCreateOrEditDialog();
                                    }

                                    handleClose();
                                }}
                                startIcon={<CloseIcon />}
                            >
                                {i18next.t(`draftSaveDialog.${isEditMode ? 'backToEdit' : 'exit'}`)}
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                variant="contained"
                                sx={{ borderRadius: '8px' }}
                                onClick={() => {
                                    if (!isEditMode) {
                                        if (draftId) {
                                            createOrUpdateDraft(values.template.category._id, values.template._id, values, draftId);
                                            toast.success(i18next.t('draftSaveDialog.success.edit'));
                                        } else {
                                            createOrUpdateDraft(values.template.category._id, values.template._id, values);
                                            toast.success(i18next.t('draftSaveDialog.success.create'));
                                        }
                                    } else {
                                        setAllDrafts(originalDrafts);
                                    }

                                    handleClose();
                                    closeCreateOrEditDialog();
                                }}
                                disabled={isLoading}
                                startIcon={<DoneIcon />}
                            >
                                {i18next.t(`draftSaveDialog.${isEditMode ? 'exit' : 'saveAsDraft'}`)}
                                {isLoading && <CircularProgress size={20} />}
                            </Button>
                        </Grid>
                    </Grid>
                </DialogActions>
            </Box>
        </Dialog>
    );
};
