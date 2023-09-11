import React, { useEffect, useRef, useState } from 'react';
import { IBasicGantt, IGanttItem } from '../../../interfaces/gantts';
import { Box, Button, Tooltip } from '@mui/material';
import { CompactDrawer } from '../../../common/CompactDrawer';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Add as AddIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { Swap } from '../../../common/Swap';
import { FieldArray, FormikProps } from 'formik';
import { IGanttItemsDisplay } from './GanttItemsDisplay';

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

    const ganttItemsDisplayRef = useRef<HTMLDivElement>(null)

    const [scrollBottom, setScrollBottom] = useState<boolean>(false)
    useEffect(() => {
        if (!scrollBottom || !ganttItemsDisplayRef.current) return;

        ganttItemsDisplayRef.current.scrollTo({ top: ganttItemsDisplayRef.current.scrollHeight, behavior: 'smooth' })
        setScrollBottom(false)
    }, [scrollBottom])

    return (
        <CompactDrawer open={open || edit} toggleMinimized={toggle} locked={edit} styleOpen={{ minWidth: '12rem' }} >
            <Box bgcolor={darkMode ? '#252525' : '#f7f7f7'} height="2.75rem" boxShadow={`inset 0 0 4px 0 rgba(0, 0, 0, 0.2)`}>
                <FieldArray name='items' validateOnChange={false}>
                    {({ push }) => (
                        <Swap
                            condition={edit}
                            isTrue={
                                <Tooltip title={i18next.t('gantts.actions.addItem')}>
                                    <Button
                                        fullWidth
                                        sx={{ height: '100%' }}
                                        disabled={isLoading}
                                        onClick={() => {
                                            push({ entityTemplate: { id: '', startDateField: '', endDateField: '', fieldsToShow: [] } } as IGanttItem);
                                            setScrollBottom(true)
                                        }}
                                    >
                                        <AddIcon sx={{ color: 'gray' }} />
                                    </Button>
                                </Tooltip>
                            }
                        />
                    )}
                </FieldArray>
            </Box>

            <Swap
                condition={edit}
                isFalse={<Box height="100%">
                    <IGanttItemsDisplay gantt={gantt} open={open} formik={formik} />
                </Box>}
                isTrue={
                    <Box height="100%">
                        <IGanttItemsDisplay containerRef={ganttItemsDisplayRef} gantt={formik.values} open={open} formik={formik} edit />
                    </Box>
                }
            />
        </CompactDrawer >
    );
};
