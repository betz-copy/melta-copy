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

export const DraftWarningDialog: React.FC<{
    isOpen: boolean;
    handleClose: () => void;
    closeCreateOrEditDialog: () => void;
    values: EntityWizardValues & { entityId?: string };
    isLoading?: boolean;
    isEditMode: boolean;
    originalDrafts: DraftsState['drafts'];
}> = ({ isOpen, handleClose, closeCreateOrEditDialog, values, isLoading = false, isEditMode, originalDrafts }) => {
    const createOrUpdateDraft = useDraftsStore((state) => state.createOrUpdateDraft);
    const setAllDrafts = useDraftsStore((state) => state.setAllDrafts);
    const draftId = useDraftIdStore((state) => state.draftId);

    return (
        <Dialog open={isOpen} maxWidth="xs" fullWidth>
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
                    <Grid container flexDirection="row" flexWrap="nowrap" justifyContent="space-between" width="100%">
                        <Grid>
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
                        <Grid>
                            <Button
                                variant="contained"
                                sx={{ borderRadius: '8px' }}
                                onClick={() => {
                                    const filterProperties = {
                                        ...Object.fromEntries(
                                            Object.entries(values.properties).filter(
                                                ([_key, value]) => typeof value === 'string' && !value.startsWith('data:image/png;base64,'),
                                            ),
                                        ),
                                        disabled: values.properties.disabled ?? false,
                                    };
                                    const newValues = { ...values, properties: filterProperties };

                                    if (isEditMode) {
                                        setAllDrafts(originalDrafts);
                                    } else if (draftId) {
                                        createOrUpdateDraft(values.template.category._id, values.template._id, newValues, draftId);
                                        toast.success(i18next.t('draftSaveDialog.success.edit'));
                                    } else {
                                        createOrUpdateDraft(values.template.category._id, values.template._id, newValues);
                                        toast.success(i18next.t('draftSaveDialog.success.create'));
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
