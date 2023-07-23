import React from 'react';
import { Box, Divider, Grid } from '@mui/material';
import { useSelector } from 'react-redux';
import { IGantt } from '../../interfaces/gantts';
import { GanttItemDisplay } from './GanttItemDisplay';
import { CompactDrawer } from '../../common/CompactDrawer';
import { RootState } from '../../store';

interface IGanttSideBarProps {
    toggle: () => any;
    open: boolean;
    gantt: IGantt;
}

export const GanttSideBar: React.FC<IGanttSideBarProps> = ({ toggle, open, gantt }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <CompactDrawer open={open} toggleMinimized={toggle} styleOpen={{ minWidth: '12rem' }}>
            <Box bgcolor={darkMode ? '#252525' : '#f7f7f7'} height="2.75rem" boxShadow="inset 0 0 4px 0 rgba(0, 0, 0, 0.2)" />

            <Grid
                container
                direction="column"
                wrap="nowrap"
                height="95%"
                sx={{
                    overflowY: 'overlay',
                    '::-webkit-scrollbar': { width: 4 },
                }}
            >
                {gantt.items.map((item, index) => (
                    <Grid item key={item.entityTemplate.id} container direction="column" alignItems="center" wrap="nowrap">
                        {Boolean(index) && <Divider sx={{ width: '85%' }} />}
                        <GanttItemDisplay item={item} expanded={open} />
                    </Grid>
                ))}
            </Grid>
        </CompactDrawer>
    );
};
