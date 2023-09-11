import React from 'react';
import { IBasicGantt } from '../../../interfaces/gantts';
import { Divider, Grid } from '@mui/material';
import { FormikProps } from 'formik';
import { GanttItemDisplay } from '../GanttItemDisplay';

interface IGanttItemsDisplayProps {
    gantt: IBasicGantt;
    open: boolean;
    formik: FormikProps<IBasicGantt>;
    edit?: boolean;
    containerRef?: React.RefObject<HTMLDivElement>;
}

export const IGanttItemsDisplay: React.FC<IGanttItemsDisplayProps> = ({ open, gantt, formik, edit, containerRef }) => {
    return (
        <Grid
            ref={containerRef}
            container
            direction="column"
            wrap='nowrap'
            height='94.7%'
            sx={{
                overflowY: 'overlay',
                '::-webkit-scrollbar': { width: 4 },
            }}
        >
            {gantt.items.map((item, index) => (
                <Grid item key={item.entityTemplate.id} container direction="column" alignItems="center" wrap='nowrap'>
                    {Boolean(index) && <Divider sx={{ width: '85%' }} />}

                    <GanttItemDisplay item={item} index={index} formik={formik} expanded={open} edit={edit} />
                </Grid>
            ))}
        </Grid>
    )
};
