import { Add, ArrowForwardIosOutlined } from '@mui/icons-material';
import { Box, Button, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import PopperSidebar from '../../../common/PopperSidebar';
import { DashboardItemCard, DashboardItemCardProps } from './DashboardItemCard';
import { DashboardItemDetails } from './DashboardItemDetails';

const AddDashboardItem: React.FC = () => {
    const theme = useTheme();

    const [_, navigate] = useLocation();

    const [openPopper, setOpenPopper] = React.useState(false);
    const [dialogContent, setDialogContent] = useState<{ mode: 'cards' | 'details'; type?: 'chart' | 'iframe' | 'table' }>({ mode: 'cards' });

    const itemsCards: DashboardItemCardProps[] = [
        {
            title: 'טבלה',
            onClick: () => navigate('/table'),
            content: <img src="/icons/dashboardViews/table.svg" />,
        },
        {
            title: 'תרשים',
            onClick: () => navigate('/charts/chart'),
            content: <img src="/icons/dashboardViews/chart.svg" />,
        },
        {
            title: 'קישור חיצוני',
            onClick: () => setDialogContent({ mode: 'details', type: 'iframe' }),
            content: <img src="/icons/dashboardViews/iframe.svg" />,
        },
    ];

    const detailsCards: Record<string, DashboardItemCardProps> = {
        table: {
            title: 'הוספת טבלה',
            onClick: () => setDialogContent({ mode: 'details', type: 'table' }),
            content: <DashboardItemDetails title="טבלה" />,
        },
        chart: {
            title: 'הוספת תרשים',
            onClick: () => setDialogContent({ mode: 'details', type: 'chart' }),
            content: <DashboardItemDetails title="תרשים" />,
        },
        iframe: {
            title: 'הוספת קישור חיצוני',
            onClick: () => setDialogContent({ mode: 'details', type: 'iframe' }),
            content: <DashboardItemDetails title="קישור חיצוני" />,
        },
    };

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
                    dialogContent.mode === 'cards' ? (
                        <Typography color={theme.palette.primary.main} fontWeight={600} fontSize={20}>
                            הוספת כרטיסייה
                        </Typography>
                    ) : (
                        <Button
                            variant="text"
                            sx={{ fontWeight: '600', fontSize: '20px' }}
                            startIcon={<ArrowForwardIosOutlined sx={{ width: '12px', height: '12px' }} />}
                            onClick={() => setDialogContent({ mode: 'cards' })}
                        >
                            {i18next.t('charts.actions.back')}
                        </Button>
                    )
                }
                side="left"
                isCheckBoxClicked
            >
                <Box display="flex" flexDirection="column" alignItems="center" gap={4} top={20} paddingTop={3}>
                    {dialogContent.mode === 'cards' ? (
                        itemsCards.map((item) => <DashboardItemCard key={item.title} {...item} />)
                    ) : (
                        <DashboardItemCard {...detailsCards[dialogContent.type!]} />
                    )}
                </Box>
            </PopperSidebar>
        </>
    );
};

export { AddDashboardItem };
