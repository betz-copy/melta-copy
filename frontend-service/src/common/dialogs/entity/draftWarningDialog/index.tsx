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
import type { Dictionary } from 'lodash';
import React from 'react';
import { toast } from 'react-toastify';
import { IEntity } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { DraftsState, useDraftIdStore, useDraftsStore } from '../../../../stores/drafts';

interface IFormValues {
    properties: IEntity['properties'];
    attachmentsProperties: Dictionary<any>;
    template: IMongoEntityTemplatePopulated;
}

export type Draft = IFormValues & { uniqueId: string; lastSavedAt: Date };

export const DraftSaveDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    closeCreateOrEditDialog: () => void;
    values: IFormValues;
    isLoading?: boolean;
    isEditMode: boolean;
    originalDrafts: DraftsState['drafts'];
    intervalRef: React.MutableRefObject<ReturnType<typeof setInterval>>;
}> = ({ open, handleClose, closeCreateOrEditDialog, values, isLoading = false, isEditMode, originalDrafts, intervalRef }) => {
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
                                        clearInterval(intervalRef.current);
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
