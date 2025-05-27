import { Check, Close, Edit } from '@mui/icons-material';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { Link } from 'wouter';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { DashboardItemType, ViewMode } from '../../../interfaces/dashboard';
import { useDarkModeStore } from '../../../stores/darkMode';
import { CardMenu } from '../../SystemManagement/components/CardMenu';
import { ConfirmDeleteDashboardItem } from '../Dialogs';

interface DashboardItemHeaderProps {
    title: string;
    backPath: { title: string; path: string };
    onDelete: () => void;
    isLoading: boolean;
    viewMode: {
        value: ViewMode;
        set: React.Dispatch<React.SetStateAction<ViewMode>>;
    };
    type: DashboardItemType;
    chartPageProps?: {
        isChartPage: boolean;
        usedInDashboard?: boolean;
    };
}

const DashboardItemHeader: React.FC<DashboardItemHeaderProps> = ({ title, backPath, onDelete, type, chartPageProps, isLoading, viewMode }) => {
    /// todo:check edit permissin: only for admin
    const hasPermission = true;
    // todo: add loading spinner
    const theme = useTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

    return (
        <Box
            bgcolor={darkMode ? '#131313' : '#fcfeff'}
            height="3.6rem"
            paddingRight="2.5rem"
            paddingTop="0.5rem"
            paddingLeft="2rem"
            paddingBottom="0.4rem"
            boxShadow="-2px 2px 6px 0px #1E277533"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            position="sticky"
            style={{ top: 0, right: 0, zIndex: 1 }}
        >
            <Box display="flex" alignItems="center" gap="15px">
                <Grid item>
                    <Link href={backPath.path} style={{ textDecoration: 'none' }}>
                        <Typography color={theme.palette.primary.main} fontWeight="400" component="h4" variant="h4" fontSize="14px">
                            {backPath.title}
                        </Typography>
                    </Link>
                </Grid>
                <Grid item>
                    <Typography color={theme.palette.primary.main} fontWeight="400" component="h4" variant="h4" fontSize="14px">
                        {'>'}
                    </Typography>
                </Grid>
                <Grid item>
                    <Typography color={theme.palette.primary.main} fontWeight="600" component="h4" variant="h4" fontSize="24px">
                        {title}
                    </Typography>
                </Grid>
            </Box>
            <Box display="flex" alignItems="center" gap="10px">
                {viewMode.value === ViewMode.ReadOnly && hasPermission && (
                    <IconButtonWithPopover
                        popoverText="עריכה"
                        iconButtonProps={{
                            onClick: () => viewMode.set(ViewMode.Edit),
                        }}
                        style={{ background: theme.palette.primary.main, borderRadius: '7px', width: '100px', height: '35px' }}
                    >
                        <Edit htmlColor="white" />
                        <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: 'white' }}>
                            עריכה
                        </Typography>
                    </IconButtonWithPopover>
                )}

                {viewMode.value !== ViewMode.ReadOnly && hasPermission && (
                    <>
                        <IconButtonWithPopover
                            popoverText="ביטול"
                            iconButtonProps={{
                                type: 'reset',
                            }}
                            style={{
                                background: '#fcfeff',
                                borderRadius: '7px',
                                border: `1px solid ${theme.palette.primary.main}`,
                                width: '100px',
                                height: '35px',
                            }}
                        >
                            <Close htmlColor={theme.palette.primary.main} />
                            <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: theme.palette.primary.main }}>
                                ביטול
                            </Typography>
                        </IconButtonWithPopover>
                        <IconButtonWithPopover
                            popoverText="שמירה"
                            iconButtonProps={{
                                type: 'submit',
                            }}
                            style={{ background: theme.palette.primary.main, borderRadius: '7px', width: '100px', height: '35px' }}
                        >
                            <Check htmlColor="white" />
                            <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: 'white' }}>
                                שמירה
                            </Typography>
                        </IconButtonWithPopover>
                    </>
                )}

                {(viewMode.value === ViewMode.Edit || viewMode.value === ViewMode.ReadOnly) && hasPermission && (
                    <Box
                        style={{
                            color: theme.palette.primary.main,
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <CardMenu onDeleteClick={() => setDeleteDialogOpen(true)} optionsIconStyle={{ color: theme.palette.primary.main }} />
                    </Box>
                )}
            </Box>

            <ConfirmDeleteDashboardItem
                isDialogOpen={deleteDialogOpen}
                handleClose={() => setDeleteDialogOpen(false)}
                onDeleteYes={onDelete}
                type={type}
                isLoading={isLoading}
                chartPageProps={chartPageProps}
            />
            {/* <deleteDialog open={deleteDialogOpen} /> */}
        </Box>
    );
};

export { DashboardItemHeader };
