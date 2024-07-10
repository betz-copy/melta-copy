import { Delete as DeleteIcon, Edit as EditIcon, MoreVertOutlined as OptionsIcon, Restore } from '@mui/icons-material';
import { Box, Card, Grid, IconButton, Menu, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useDraftsStore } from '../../stores/drafts';
import { MeltaTooltip } from '../MeltaTooltip';
import { MenuButton } from '../MenuButton';
import { AreYouSureDialog } from '../dialogs/AreYouSureDialog';
import type { Draft } from '../dialogs/entity/draftWarningDialog';

export const DraftCard: React.FC<{ draft: Draft; openEditDialog: () => void }> = ({ draft, openEditDialog }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const isMenuOpen = Boolean(anchorEl);

    const [deleteDialogState, setDeleteDialogState] = useState(false);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const { createdAt, disabled, _id, updatedAt, ...displayProperties } = draft.properties;

    const draftProperties = useMemo(
        () =>
            Object.values(displayProperties ?? [])
                .filter(Boolean)
                .map((displayProperty) => displayProperty.toString().substring(0, 50))
                .join(' / ')
                .substring(0, 750) || i18next.t('draftSaveDialog.emptyDraft'),
        [displayProperties],
    );
    const deleteDraft = useDraftsStore((state) => state.deleteDraft);

    return (
        <>
            <Card
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingX: '0.75rem',
                    paddingY: '0.5rem',
                    borderRadius: '1rem',
                    boxShadow: 'rgba(30, 39, 117, 0.3) -2px 2px 6px 0px',
                    margin: '0.5rem 1rem 0.5rem 0.2rem',
                }}
            >
                <Box sx={{ width: '12rem' }}>
                    <Box display="flex" alignItems="center" gap="0.25rem">
                        {draft.entityId && (
                            <MeltaTooltip title={i18next.t('draftSaveDialog.editDraft')}>
                                <Restore />
                            </MeltaTooltip>
                        )}

                        <Typography variant="subtitle2">{i18next.t('draftSaveDialog.draft')}</Typography>
                    </Box>

                    <MeltaTooltip title={draftProperties}>
                        <Typography noWrap>{draftProperties}</Typography>
                    </MeltaTooltip>
                </Box>

                <IconButton onClick={handleClick}>
                    <OptionsIcon />
                </IconButton>
            </Card>

            <Menu open={isMenuOpen} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}>
                <Grid>
                    <MenuButton onClick={openEditDialog} text={i18next.t('actions.edit')} icon={<EditIcon color="action" />} />
                </Grid>

                <Grid>
                    <MenuButton onClick={() => setDeleteDialogState(true)} text={i18next.t('actions.delete')} icon={<DeleteIcon color="action" />} />
                </Grid>
            </Menu>

            <AreYouSureDialog
                open={deleteDialogState}
                handleClose={() => setDeleteDialogState(false)}
                onYes={() => {
                    deleteDraft(draft.template.category._id, draft.template._id, draft.uniqueId);
                    toast.success(i18next.t('draftSaveDialog.success.delete'));
                    setDeleteDialogState(false);
                }}
            />
        </>
    );
};
