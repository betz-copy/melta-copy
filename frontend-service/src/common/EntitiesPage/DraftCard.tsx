import { Delete as DeleteIcon, Edit as EditIcon, MoreVertOutlined as OptionsIcon, Restore } from '@mui/icons-material';
import { Box, Card, Grid, IconButton, Menu, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import '../../css/draft.css';
import { useDraftsStore } from '../../stores/drafts';
import { AreYouSureDialog } from '../dialogs/AreYouSureDialog';
import type { Draft } from '../dialogs/entity/draftWarningDialog';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';
import { MenuButton } from '../MenuButton';

export const DraftCard: React.FC<{ draft: Draft; openEditDialog: () => void }> = ({ draft, openEditDialog }) => {
    const replaceHtmlTagsRegex = /(<([^>]+)>)/gi;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const isMenuOpen = Boolean(anchorEl);

    const [deleteDialogState, setDeleteDialogState] = useState(false);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const { _createdAt, _disabled, _id, _updatedAt, ...displayProperties } = draft.properties;

    const draftPropertiesToDisplayOnHover = useMemo(
        () =>
            Object.values(displayProperties ?? [])
                .filter(Boolean)
                .map((displayProperty) => displayProperty.toString().replace(replaceHtmlTagsRegex, '').substring(0, 50))
                .join(' / ')
                .substring(0, 750) || i18next.t('draftSaveDialog.emptyDraft'),
        // biome-ignore lint/correctness/useExhaustiveDependencies: old code
        [displayProperties],
    );

    const deleteDraft = useDraftsStore((state) => state.deleteDraft);

    return (
        <>
            <Card className="draft-card">
                <Box sx={{ width: '12rem' }}>
                    <Box display="flex" alignItems="center" gap="0.25rem">
                        {draft.entityId && (
                            <MeltaTooltip title={i18next.t('draftSaveDialog.editDraft')}>
                                <Restore />
                            </MeltaTooltip>
                        )}
                        <Typography variant="subtitle2">{i18next.t('draftSaveDialog.draft')}</Typography>
                    </Box>

                    <MeltaTooltip title={draftPropertiesToDisplayOnHover}>
                        <Typography noWrap>{draftPropertiesToDisplayOnHover}</Typography>
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
