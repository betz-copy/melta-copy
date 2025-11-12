/* eslint-disable no-nested-ternary */
import { Hive as HiveIcon, Menu } from '@mui/icons-material';
import { Grid, ListItemText, Typography, useTheme } from '@mui/material';
import React from 'react';
import { CustomIcon } from '../../CustomIcon';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';

export type MenuItemContentProps<Option = any> = {
    checked?: boolean;
    indeterminate?: boolean;
    label: string;
    order: number;
    isDraggable?: boolean;
    group?: boolean;
    insideGroup?: boolean;
    option?: Option;
    showIcon?: boolean;
};

export const MenuItemContent: React.FC<MenuItemContentProps> = ({
    checked,
    indeterminate,
    label,
    isDraggable,
    group,
    insideGroup,
    showIcon,
    option,
}) => {
    const theme = useTheme();

    return (
        <>
            {!group && (
                <Grid
                    style={{
                        width: '24px',
                        height: '24px',
                        gap: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignContent: 'center',
                        justifyContent: 'center',
                        marginRight: insideGroup ? '30px' : '7px',
                    }}
                >
                    {isDraggable && <Menu sx={{ fontSize: '1rem' }} />}
                </Grid>
            )}
            {showIcon ? (
                option.iconFileId?.length ? (
                    <CustomIcon color={theme.palette.primary.main} iconUrl={option.iconFileId!} height="15px" width="15px" />
                ) : (
                    <HiveIcon style={{ color: theme.palette.primary.main }} fontSize="inherit" />
                )
            ) : (
                <MeltaCheckbox
                    checked={checked}
                    indeterminate={indeterminate}
                    sxChecked={{ width: '18px', height: '18px' }}
                    sx={{
                        '&:hover': {
                            backgroundColor: 'transparent',
                        },
                    }}
                />
            )}

            <ListItemText
                primary={
                    <MeltaTooltip title={label}>
                        <Typography
                            style={{
                                fontFamily: 'Rubik',
                                fontSize: '14px',
                                fontWeight: '400',
                                lineHeight: '17px',
                                letterSpacing: '0em',
                                textAlign: 'right',
                                width: '120px',
                                height: '17px',
                                marginRight: '10px',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                            }}
                        >
                            {label}
                        </Typography>
                    </MeltaTooltip>
                }
            />
        </>
    );
};
