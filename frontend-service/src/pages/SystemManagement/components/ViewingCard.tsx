import React, { MouseEventHandler } from 'react';
import { Grid, IconButton, Card, CardHeader, Menu, Tooltip } from '@mui/material';
import i18next from 'i18next';
import { Edit as EditIcon, Delete as DeleteIcon, MoreVertOutlined as OptionsIcon, DoDisturbAlt as DisabledIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { MenuButton } from '../../../common/MenuButton';
import { RootState } from '../../../store';

export const ViewingCard: React.FC<{
    title: React.ReactNode;
    icon?: React.ReactNode;
    color?: string;
    onEditClick: MouseEventHandler;
    onDeleteClick?: MouseEventHandler;
    minWidth: number;
    disabledProps?: { isDisabled: boolean; canEdit: boolean; tooltipTitle: string };
    onDisableClick?: MouseEventHandler;
}> = ({ title, icon, onEditClick, onDeleteClick, minWidth, disabledProps, onDisableClick, color }) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const darkMode = useSelector((state: RootState) => state.darkMode);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event) => {
        setAnchorEl(event.currentTarget);
    };

    return (
        <Grid item>
            <Card
                sx={{
                    bgcolor: darkMode ? '#171717' : 'white',
                    minWidth: `${minWidth}px`,
                    opacity: disabledProps?.isDisabled ? '0.4' : '1',
                    ':hover': { transform: 'scale(1.05)' },
                    border: `3px solid ${color}`,
                    borderRadius: '17px',
                }}
            >
                <CardHeader
                    avatar={icon}
                    title={title}
                    titleTypographyProps={{ fontSize: '1.5rem' }}
                    action={
                        <>
                            <IconButton onClick={handleClick}>
                                <OptionsIcon />
                            </IconButton>
                            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                                <Tooltip
                                    arrow
                                    placement="right"
                                    title={disabledProps?.tooltipTitle || String(i18next.t('systemManagement.defaultCantEdit'))}
                                    disableHoverListener={!disabledProps?.canEdit}
                                >
                                    <Grid>
                                        <MenuButton
                                            onClick={(e) => {
                                                onEditClick(e);
                                                handleClose(e);
                                            }}
                                            text={i18next.t('actions.edit')}
                                            disabled={disabledProps?.canEdit}
                                            icon={<EditIcon color="action" />}
                                        />
                                    </Grid>
                                </Tooltip>

                                {onDeleteClick && (
                                    <MenuButton
                                        onClick={(e) => {
                                            onDeleteClick(e);
                                            handleClose(e);
                                        }}
                                        text={i18next.t('actions.delete')}
                                        icon={<DeleteIcon color="action" />}
                                    />
                                )}

                                {onDisableClick && (
                                    <MenuButton
                                        onClick={(e) => {
                                            onDisableClick(e);
                                            handleClose(e);
                                        }}
                                        text={disabledProps?.isDisabled ? i18next.t('actions.activate') : i18next.t('actions.disable')}
                                        icon={<DisabledIcon color="action" />}
                                    />
                                )}
                            </Menu>
                        </>
                    }
                />
            </Card>
        </Grid>
    );
};
