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
import { MenuButton } from '../../../common/MenuButton';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { environment } from '../../../globals';
import { useUserStore } from '../../../stores/user';

export const CardMenu: React.FC<{
    onEditClick: MouseEventHandler;
    onDeleteClick?: MouseEventHandler;
    disabledProps?: { isDisabled: boolean; isEditDisabled: boolean; tooltipTitle: string; editTooltipTitle?: string };
    onDisableClick?: MouseEventHandler;
    onDuplicateClick?: MouseEventHandler;
    onAddActionsClick?: MouseEventHandler;
    isEntityTemplateDisabled?: boolean;
    isRuleDisabled?: boolean;
}> = ({
    onEditClick,
    onDeleteClick,
    disabledProps,
    onDisableClick,
    onDuplicateClick,
    onAddActionsClick,
    isEntityTemplateDisabled,
    isRuleDisabled,
}) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const currentUser = useUserStore((state) => state.user);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
    };

    const editTooltipTitle = useMemo(() => {
        if (disabledProps?.isEditDisabled && disabledProps?.editTooltipTitle) return disabledProps.editTooltipTitle;
        if (disabledProps?.isDisabled) return disabledProps.tooltipTitle;
        return i18next.t('systemManagement.defaultCantEdit');
    }, [disabledProps]);

    return (
        <>
            <IconButton onClick={handleClick} style={{ ...environment.iconSize }}>
                <OptionsIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
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

                {onDuplicateClick && (
                    <MenuButton
                        onClick={(e) => {
                            onDuplicateClick(e);
                            handleClose(e);
                        }}
                        text={i18next.t('actions.duplicate')}
                        icon={<DuplicateIcon color="action" />}
                    />
                )}

                {onAddActionsClick && currentUser.isRoot && (
                    <MenuButton
                        onClick={(e) => {
                            onAddActionsClick(e);
                            handleClose(e);
                        }}
                        text={i18next.t('actions.addActions')}
                        icon={<AddIcon color="action" />}
                    />
                )}

                {onDeleteClick && (
                    <MeltaTooltip placement="left" title={disabledProps?.tooltipTitle}>
                        <Grid>
                            <MenuButton
                                onClick={(e) => {
                                    onDeleteClick(e);
                                    handleClose(e);
                                }}
                                text={i18next.t('actions.delete')}
                                disabled={disabledProps?.isDisabled || isEntityTemplateDisabled}
                                icon={<DeleteIcon color="action" />}
                            />
                        </Grid>
                    </MeltaTooltip>
                )}

                {onDisableClick && (
                    <MenuButton
                        onClick={(e) => {
                            onDisableClick(e);
                            handleClose(e);
                        }}
                        text={isEntityTemplateDisabled || isRuleDisabled ? i18next.t('actions.activate') : i18next.t('actions.disable')}
                        icon={
                            isEntityTemplateDisabled || isRuleDisabled ? (
                                <DoNotDisturbOffOutlinedIcon color="action" />
                            ) : (
                                <DoNotDisturbOnOutlinedIcon color="action" />
                            )
                        }
                    />
                )}
            </Menu>
        </>
    );
};
