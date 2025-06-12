import { Add } from '@mui/icons-material';
import { Box, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties } from 'react';
import { useLocation } from 'wouter';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import PopperSidebar from '../../../common/PopperSidebar';
import { useUserStore } from '../../../stores/user';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { DashboardItemCard, DashboardItemCardProps } from './DashboardItemCard';
import { environment } from '../../../globals';

const { chartPath, tablePath, iFramePath } = environment.dashboard;

const AddDashboardItem: React.FC<{ overrideStyle?: CSSProperties }> = ({ overrideStyle }) => {
    const theme = useTheme();
    const currentUser = useUserStore((state) => state.user);

    const [_, navigate] = useLocation();

    const [openPopper, setOpenPopper] = React.useState(false);

    const itemsCards: DashboardItemCardProps[] = [
        {
            title: i18next.t('dashboard.itemType.table'),
            onClick: () => navigate(tablePath),
            imgSrc: '/icons/dashboardViews/table.svg',
        },
        {
            title: i18next.t('dashboard.itemType.chart'),
            onClick: () => navigate(`${chartPath}/chart`, { state: { isDashboardPage: true } }),
            imgSrc: '/icons/dashboardViews/chart.svg',
        },
        {
            title: i18next.t('dashboard.itemType.iframe'),
            onClick: () => navigate(iFramePath),
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
                style={
                    overrideStyle ?? {
                        background: theme.palette.primary.main,
                        borderRadius: '7px',
                        width: '150px',
                        height: '35px',
                        fontSize: '13px',
                        fontWeight: '400',
                        color: 'white',
                        fontFamily: 'Rubik',
                        gap: '5px',
                    }
                }
            >
                <Add fontSize="small" htmlColor={!overrideStyle ? 'white' : undefined} />
                {i18next.t('dashboard.addCard')}
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
