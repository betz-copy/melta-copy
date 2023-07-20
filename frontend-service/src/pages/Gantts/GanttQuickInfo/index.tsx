import React from 'react';
import { IScheduleComponentData } from '../../../interfaces/syncfusion';
import { GanttEvent } from '../GanttEvent';
import { Grid } from '@mui/material';

export const GanttQuickInfo: React.FC<IScheduleComponentData> = (props) => {
    return (
        <Grid container alignItems="center" justifyContent="space-around" padding='1rem'>
            <GanttEvent {...props} expanded />
        </Grid>
    );
};
