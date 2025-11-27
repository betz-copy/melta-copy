import { Divider, Grid } from '@mui/material';
import { FormikProps } from 'formik';
import React from 'react';
import { IBasicGantt } from '../../../interfaces/gantts';
import { GanttItemDisplay } from '../GanttItemDisplay';
import { GroupByDisplay } from './GroupByDisplay';

interface IGanttItemsDisplayProps {
    gantt: IBasicGantt;
    open: boolean;
    formik: FormikProps<IBasicGantt>;
    edit?: boolean;
    containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const GanttItemsDisplay: React.FC<IGanttItemsDisplayProps> = ({ open, gantt, formik, edit, containerRef }) => {
    return (
        <Grid
            ref={containerRef}
            direction="column"
            alignItems="center"
            wrap="nowrap"
            height="94.7%"
            sx={{
                overflowY: 'overlay',
                '::-webkit-scrollbar': { width: 4 },
            }}
        >
            {Boolean(gantt.groupBy) && (
                <>
                    <GroupByDisplay groupBy={gantt.groupBy!} formik={formik} expanded={open} edit={edit} />
                    <Divider sx={{ width: '100%', borderWidth: '2px' }} />
                </>
            )}

            {gantt.items.map((item, index) => (
                // can't use item.entityTemplate.id because it doesn't necessary exist in edit mode
                // biome-ignore lint/suspicious/noArrayIndexKey: Yahalom knows what he's doing
<Grid key={index} container direction="column" alignItems="center" wrap="nowrap">
                    {Boolean(index) && <Divider sx={{ width: '85%' }} />}

                    <GanttItemDisplay item={item} index={index} formik={formik} expanded={open} edit={edit} />
                </Grid>
            ))}
        </Grid>
    );
};
