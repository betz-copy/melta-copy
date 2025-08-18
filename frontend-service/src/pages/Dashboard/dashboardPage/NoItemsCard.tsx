import { Box, Card, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import BlueTitle from '../../../common/MeltaDesigns/BlueTitle';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { AddDashboardItem } from '../AddDashboardItem';

const NoItemsCard: React.FC = () => {
    const theme = useTheme();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const currentUser = useUserStore((state) => state.user);
    const hasAdminPermissions = isWorkspaceAdmin(currentUser.currentWorkspacePermissions);

    return (
        <Box position="relative">
            {!hasAdminPermissions && (
                <Box
                    component="img"
                    src="/icons/soon.svg"
                    sx={{
                        position: 'absolute',
                        top: -10,
                        left: -15,
                        width: 140,
                        zIndex: 10,
                    }}
                />
            )}
            <Card
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px dashed #9398C2',
                    borderRadius: '7px',
                    padding: '25px',
                }}
            >
                {hasAdminPermissions && (
                    <BlueTitle
                        title={i18next.t('dashboard.noItems.admin.title')}
                        component="h4"
                        variant="h4"
                        style={{ fontSize: workspace.metadata.mainFontSizes.headlineTitleFontSize, padding: '10px' }}
                    />
                )}
                <Typography
                    color={theme.palette.primary.main}
                    fontSize="20px"
                    marginTop={!hasAdminPermissions ? '30px' : undefined}
                    padding={!hasAdminPermissions ? '25px 25px 10px 25px' : undefined}
                >
                    {i18next.t(`dashboard.noItems.${hasAdminPermissions ? 'admin.' : ''}description`)}
                </Typography>
                {hasAdminPermissions && (
                    <Typography color="#9398C2" fontSize="18px">
                        {i18next.t('dashboard.noItems.admin.comment')}
                    </Typography>
                )}
                <img src="/icons/dashboardViews/chart.svg" style={{ opacity: 0.5, padding: '20px' }} />
                {hasAdminPermissions && (
                    <AddDashboardItem
                        overrideStyle={{
                            display: 'flex',
                            gap: '0.25rem',
                            borderRadius: '5px',
                            fontSize: '14px',
                            fontWeight: 400,
                            color: theme.palette.primary.main,
                            padding: '10px',
                        }}
                    />
                )}
            </Card>
        </Box>
    );
};

export default NoItemsCard;
