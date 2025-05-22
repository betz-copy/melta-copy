import { Add } from '@mui/icons-material';
import { Box, Typography, useTheme } from '@mui/material';
import React from 'react';
import { useLocation } from 'wouter';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import PopperSidebar from '../../../common/PopperSidebar';
import { useSearchParams } from '../../../utils/hooks/useSearchParams';
import { DashboardItemCard, DashboardItemCardProps } from './DashboardItemCard';

const AddDashboardItem: React.FC = () => {
    const theme = useTheme();

    const [_, navigate] = useLocation();

    const [openPopper, setOpenPopper] = React.useState(false);
    const [searchParams, setSearchParams] = useSearchParams({});

    const itemsCards: DashboardItemCardProps[] = [
        {
            title: 'טבלה',
            onClick: () => navigate('/table'),
            content: <img src="/icons/dashboardViews/table.svg" />,
        },
        {
            title: 'תרשים',
            onClick: () => navigate('/charts/chart', { state: { isChartPage: false } }),
            content: <img src="/icons/dashboardViews/chart.svg" />,
        },
        {
            title: 'קישור חיצוני',
            onClick: () => navigate('/iframe'),
            content: <img src="/icons/dashboardViews/iframe.svg" />,
        },
    ];

    return (
        <>
            <IconButtonWithPopover
                popoverText="הוספת כרטיסייה"
                iconButtonProps={{
                    onClick: () => setOpenPopper((previousOpen) => !previousOpen),
                }}
                style={{ background: theme.palette.primary.main, borderRadius: '7px', width: '150px', height: '35px' }}
            >
                <Add htmlColor="white" />
                <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: 'white' }}>
                    הוספת כרטיסייה
                </Typography>
            </IconButtonWithPopover>

            <PopperSidebar
                open={openPopper}
                setOpen={setOpenPopper}
                title={
                    <Typography color={theme.palette.primary.main} fontWeight={600} fontSize={20}>
                        הוספת כרטיסייה
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
