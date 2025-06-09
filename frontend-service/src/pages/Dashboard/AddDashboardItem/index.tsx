import { Add } from '@mui/icons-material';
import { Box, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useLocation } from 'wouter';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import PopperSidebar from '../../../common/PopperSidebar';
import { useUserStore } from '../../../stores/user';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { DashboardItemCard, DashboardItemCardProps } from './DashboardItemCard';

const AddDashboardItem: React.FC = () => {
    const theme = useTheme();
    const currentUser = useUserStore((state) => state.user);

    const [_, navigate] = useLocation();

    const [openPopper, setOpenPopper] = React.useState(false);

    const itemsCards: DashboardItemCardProps[] = [
        {
            title: i18next.t('dashboard.itemType.table'),
            onClick: () => navigate('/table'),
            imgSrc: '/icons/dashboardViews/table.svg',
        },
        {
            title: i18next.t('dashboard.itemType.chart'),
            onClick: () => navigate('/charts/chart', { state: { isDashboardPage: true } }),
            imgSrc: '/icons/dashboardViews/chart.svg',
        },
        {
            title: i18next.t('dashboard.itemType.iframe'),
            onClick: () => navigate('/iframe'),
            imgSrc: '/icons/dashboardViews/iframe.svg',
        },
    ];

    if (!isWorkspaceAdmin(currentUser.currentWorkspacePermissions)) return null;

    return (
        <>
            <IconButtonWithPopover
                popoverText={i18next.t('dashboard.addCard')}
                iconButtonProps={{
                    onClick: () => setOpenPopper((previousOpen) => !previousOpen),
                }}
                style={{ background: theme.palette.primary.main, borderRadius: '7px', width: '150px', height: '35px' }}
            >
                <Add htmlColor="white" />
                <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: 'white' }}>
                    {i18next.t('dashboard.addCard')}
                </Typography>
            </IconButtonWithPopover>

            <PopperSidebar
                open={openPopper}
                setOpen={setOpenPopper}
                title={
                    <Typography color={theme.palette.primary.main} fontWeight={600} fontSize={20}>
                        {i18next.t('dashboard.addCard')}
                    </Typography>
                }
                side="left"
                isCheckBoxClicked
            >
                <Box display="flex" flexDirection="column" alignItems="center" gap={4} top={20} paddingTop={3}>
                    {itemsCards.map((item) => (
                        <DashboardItemCard key={item.title} {...item} />
                    ))}
                </Box>
            </PopperSidebar>
        </>
    );
};

export { AddDashboardItem };
