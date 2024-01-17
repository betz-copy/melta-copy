import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Grid } from '@mui/material';
import { useSelector } from 'react-redux';
import { Add as AddIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { FieldArray, FormikProps } from 'formik';
import { Swap } from '../../../common/Swap';
import { RootState } from '../../../store';
import { CompactDrawer } from '../../../common/CompactDrawer';
import { IBasicGantt, IGanttItem } from '../../../interfaces/gantts';
import { GanttItemsDisplay } from './GanttItemsDisplay';
import { MeltaTooltip } from '../../../common/MeltaTooltip';

interface IGanttSideBarProps {
    gantt: IBasicGantt;
    open: boolean;
    toggle: () => void;
    formik: FormikProps<IBasicGantt>;
    edit: boolean;
    isLoading: boolean;
}

export const GanttSideBar: React.FC<IGanttSideBarProps> = ({ toggle, open, gantt, formik, edit, isLoading }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

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
