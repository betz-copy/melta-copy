import React, { MouseEventHandler, useMemo } from 'react';
import { Grid, IconButton, Menu } from '@mui/material';
import i18next from 'i18next';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVertOutlined as OptionsIcon,
    DoNotDisturbOnOutlined as DoNotDisturbOnOutlinedIcon,
    DoNotDisturbOffOutlined as DoNotDisturbOffOutlinedIcon,
    ContentCopy as DuplicateIcon,
    ControlPoint as AddIcon,
} from '@mui/icons-material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { MenuButton } from '../../../common/MenuButton';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';

export const CardMenu: React.FC<{
    onOptionsIconClose?: () => void;
    onEditClick?: MouseEventHandler;
    onDeleteClick?: MouseEventHandler;
    disabledProps?: {
        isDisabled?: boolean;
        isEditDisabled: boolean;
        isDeleteDisabled?: boolean;
        tooltipTitle: string;
        editTooltipTitle?: string;
        disableForReadPermissions?: boolean;
    };
    onDisableClick?: MouseEventHandler;
    onDuplicateClick?: MouseEventHandler;
    onAddActionsClick?: MouseEventHandler;
    onConvertToRelationShipFieldClick?: MouseEventHandler;
    onOptionsIconClick?: () => Promise<void>;
}> = ({
    onOptionsIconClose,
    onEditClick,
    onDeleteClick,
    disabledProps,
    onDisableClick,
    onDuplicateClick,
    onAddActionsClick,
    onConvertToRelationShipFieldClick,
    onOptionsIconClick,
}) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { iconSize } = workspace.metadata;
    const currentUser = useUserStore((state) => state.user);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);

        if (onOptionsIconClick) onOptionsIconClick();
    };

    const handleClose = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
        if (onOptionsIconClose) onOptionsIconClose();
    };

    const editTooltipTitle = useMemo(() => {
        if (disabledProps?.isEditDisabled && disabledProps?.editTooltipTitle) return disabledProps.editTooltipTitle;
        if (disabledProps?.isDeleteDisabled) return disabledProps.tooltipTitle;
        return i18next.t('systemManagement.defaultCantEdit');
    }, [disabledProps]);

    return (
        <>
            <IconButton onClick={handleClick} style={{ ...iconSize }}>
                <OptionsIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                {onEditClick && (
                    <MeltaTooltip placement="left" title={editTooltipTitle} disableHoverListener={!disabledProps?.isEditDisabled}>
                        <Grid>
                            <MenuButton
                                onClick={(e) => {
                                    onEditClick(e);
                                    handleClose(e);
                                }}
                                text={i18next.t('actions.edit')}
                                disabled={disabledProps?.isEditDisabled}
                                icon={<EditIcon color="action" />}
                            />
                        </Grid>
                    </MeltaTooltip>
                )}

                {onDuplicateClick && (
                    <MeltaTooltip
                        placement="left"
                        title={disabledProps?.isDisabled && disabledProps?.tooltipTitle}
                        disableHoverListener={!disabledProps?.isEditDisabled}
                    >
                        <Grid>
                            <MenuButton
                                onClick={(e) => {
                                    onDuplicateClick(e);
                                    handleClose(e);
                                }}
                                text={i18next.t('actions.duplicate')}
                                icon={<DuplicateIcon color="action" />}
                                disabled={disabledProps?.isDisabled}
                            />
                        </Grid>
                    </MeltaTooltip>
                )}

                {onAddActionsClick && currentUser.isRoot && (
                    <MeltaTooltip
                        placement="left"
                        title={disabledProps?.isDisabled && disabledProps?.tooltipTitle}
                        disableHoverListener={!disabledProps?.isEditDisabled}
                    >
                        <Grid>
                            <MenuButton
                                onClick={(e) => {
                                    onAddActionsClick(e);
                                    handleClose(e);
                                }}
                                text={i18next.t('actions.addActions')}
                                disabled={disabledProps?.isDisabled}
                                icon={<AddIcon color="action" />}
                            />
                        </Grid>
                    </MeltaTooltip>
                )}

                {onDeleteClick && (
                    <MeltaTooltip
                        placement="left"
                        title={disabledProps?.isDisabled || disabledProps?.isDeleteDisabled ? disabledProps?.tooltipTitle : ''}
                    >
                        <Grid>
                            <MenuButton
                                onClick={(e) => {
                                    onDeleteClick(e);
                                    handleClose(e);
                                }}
                                text={i18next.t('actions.delete')}
                                disabled={disabledProps?.isDisabled || disabledProps?.isDeleteDisabled}
                                icon={<DeleteIcon color="action" />}
                            />
                        </Grid>
                    </MeltaTooltip>
                )}
                {onConvertToRelationShipFieldClick && (
                    <MeltaTooltip placement="left" title={editTooltipTitle} disableHoverListener={!disabledProps?.isEditDisabled}>
                        <Grid>
                            <MenuButton
                                onClick={(e) => {
                                    onConvertToRelationShipFieldClick(e);
                                    handleClose(e);
                                }}
                                text={i18next.t('actions.convertToRelationShipFieldClick')}
                                icon={<CompareArrowsIcon color="action" />}
                                disabled={disabledProps?.isEditDisabled}
                            />
                        </Grid>
                    </MeltaTooltip>
                )}

                {onDisableClick && (
                    <MeltaTooltip placement="left" title={editTooltipTitle} disableHoverListener={!disabledProps?.disableForReadPermissions}>
                        <Grid>
                            <MenuButton
                                onClick={(e) => {
                                    onDisableClick(e);
                                    handleClose(e);
                                }}
                                text={disabledProps?.isDisabled ? i18next.t('actions.activate') : i18next.t('actions.disable')}
                                icon={
                                    disabledProps?.isDisabled ? (
                                        <DoNotDisturbOffOutlinedIcon color="action" />
                                    ) : (
                                        <DoNotDisturbOnOutlinedIcon color="action" />
                                    )
                                }
                                disabled={disabledProps?.disableForReadPermissions}
                            />
                        </Grid>
                    </MeltaTooltip>
                )}
            </Menu>
        </>
    );
};
