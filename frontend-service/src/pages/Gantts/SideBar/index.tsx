import { Add as AddIcon } from '@mui/icons-material';
import { Box, Button, Grid } from '@mui/material';
import { IGantt, IGanttItem } from '@packages/gantt';
import { FieldArray, FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { CompactDrawer } from '../../../common/CompactDrawer';
import MeltaTooltip from '../../../common/MeltaDesigns/MeltaTooltip';
import { Swap } from '../../../common/Swap';
import { useDarkModeStore } from '../../../stores/darkMode';
import { GanttItemsDisplay } from './GanttItemsDisplay';

interface IGanttSideBarProps {
    gantt: IGantt;
    open: boolean;
    toggle: () => void;
    formik: FormikProps<IGantt>;
    edit: boolean;
    isLoading: boolean;
}

export const GanttSideBar: React.FC<IGanttSideBarProps> = ({ toggle, open, gantt, formik, edit, isLoading }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const ganttItemsDisplayRef = useRef<HTMLDivElement>(null);

    const [scrollBottom, setScrollBottom] = useState<boolean>(false);
    useEffect(() => {
        if (!scrollBottom || !ganttItemsDisplayRef.current) return;

        ganttItemsDisplayRef.current.scrollTo({ top: ganttItemsDisplayRef.current.scrollHeight, behavior: 'smooth' });
        setScrollBottom(false);
    }, [scrollBottom]);

    return (
        <CompactDrawer
            open={open || edit}
            toggleMinimized={toggle}
            locked={edit}
            styleOpen={{ minWidth: edit ? '35rem' : '12rem', maxWidth: '24rem' }}
        >
            <Box bgcolor={darkMode ? '#252525' : '#f7f7f7'} height="2.75rem" boxShadow="inset 0 0 4px 0 rgba(0, 0, 0, 0.2)">
                <FieldArray name="items" validateOnChange={false}>
                    {({ push }) => (
                        <Swap
                            condition={edit}
                            isTrue={
                                <Grid>
                                    <MeltaTooltip title={i18next.t('gantts.actions.addItem')}>
                                        <Button
                                            fullWidth
                                            sx={{ height: '100%' }}
                                            disabled={isLoading}
                                            onClick={() => {
                                                push({
                                                    entityTemplate: { id: '', startDateField: '', endDateField: '', fieldsToShow: [] },
                                                    connectedEntityTemplates: [],
                                                } as IGanttItem);
                                                setScrollBottom(true);
                                            }}
                                        >
                                            <AddIcon sx={{ color: 'gray' }} />
                                        </Button>
                                    </MeltaTooltip>
                                </Grid>
                            }
                        />
                    )}
                </FieldArray>
            </Box>

            <Swap
                condition={edit}
                isFalse={
                    <Box height="100%">
                        <GanttItemsDisplay gantt={gantt} open={open} formik={formik} />
                    </Box>
                }
                isTrue={
                    <Box height="100%">
                        <GanttItemsDisplay containerRef={ganttItemsDisplayRef} gantt={formik.values} open={open} formik={formik} edit />
                    </Box>
                }
            />
        </CompactDrawer>
    );
};
