import { Grid } from '@mui/material';
import React from 'react';
import { IScheduleComponentData } from '../../../interfaces/syncfusion';
import { GanttEvent } from '../GanttEvent';

export const GanttQuickInfo: React.FC<IScheduleComponentData> = (props) => {
    return (
        <Grid container alignItems="center" justifyContent="space-around" padding="1rem">
            <GanttEvent {...props} expanded />
        </Grid>
    );
};
