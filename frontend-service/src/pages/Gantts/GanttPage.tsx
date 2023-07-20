import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { getGanttById } from '../../services/ganttsService';
import { Box, CircularProgress, Grid } from '@mui/material';
import { Day, Inject, Month, ResourceDirective, ResourcesDirective, ScheduleComponent, TimelineMonth, TimelineViews, ViewDirective, ViewsDirective, Week } from '@syncfusion/ej2-react-schedule';
import { L10n, loadCldr } from '@syncfusion/ej2-base';
import { TopBar } from '../../common/TopBar';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import i18next from 'i18next';
import { GanttSideBar } from './GanttSideBar';
import { getEntitiesWithDirectConnections } from '../../services/entitiesService';
import { getEntitiesSearchBody, getScheduleComponentData, getScheduleComponentResourceData } from '../../utils/gantts';
import { GanttEvent } from './GanttEvent';
import { GanttQuickInfo } from './GanttQuickInfo';
import hebrew from '../../i18n/hebrew';
import numberingSystems from '../../CLDR/hebrew/numberingSystems.json'
import timeZoneNames from '../../CLDR/hebrew/timeZoneNames.json'
import numbers from '../../CLDR/hebrew/numbers.json'
import caHebrew from '../../CLDR/hebrew/ca-hebrew.json'
import { useDynamicStyleSheet } from '../../utils/useDynamicStyleSheet';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useLocalStorage } from '../../utils/useLocalStorage';
import { environment } from '../../globals';
import lightTheme from '../../css/syncfusion/light.css?inline';
import darkTheme from '../../css/syncfusion/dark.css?inline';
import '../../css/syncfusion/schedule.css';

loadCldr(numberingSystems, caHebrew, timeZoneNames, numbers);
L10n.load({ 'he-IL': hebrew.schedule })

const { ganttSettings } = environment;

interface IGanttPageProps {
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const GanttPage: React.FC<IGanttPageProps> = ({ setTitle }) => {
    const topBarRef = useRef<HTMLDivElement>(null);
    const scheduleRef = useRef<ScheduleComponent>(null);

    const { ganttId } = useParams();

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const [renderedDates, setRenderedDates] = useState<Date[]>([new Date()]);

    const [sideBarOpen, setSideBarOpen] = useLocalStorage(ganttSettings.isSidebarOpenLocalStorageKey, true);

    const darkMode = useSelector((state: RootState) => state.darkMode);
    useDynamicStyleSheet(darkMode ? darkTheme : lightTheme);

    const { data: gantt } = useQuery(['getGantt', ganttId], () => getGanttById(ganttId!));

    useEffect(() => setTitle(gantt?.name || ''), [gantt, setTitle]);

    const resources = useMemo(() => gantt && getScheduleComponentResourceData(gantt.items, entityTemplates), [gantt, entityTemplates]);

    const { data } = useQuery(['getGanttEntities', gantt, renderedDates, entityTemplates], async () => {
        if (!gantt || !renderedDates.length) return [];

        const searchBody = getEntitiesSearchBody(gantt.items, renderedDates[0], renderedDates[renderedDates.length - 1], 1000, 0, entityTemplates);
        const { entities } = await getEntitiesWithDirectConnections(searchBody);

        return getScheduleComponentData(entities, gantt.items, entityTemplates);
    });

    if (!gantt) return <CircularProgress />

    return (
        <>
            <Box ref={topBarRef}>
                <TopBar title={gantt?.name} boxStyle={{ marginBottom: 0 }} />
            </Box>

            <Grid container wrap='nowrap' position='relative' alignItems="stretch" height="94vh">
                <Grid item>
                    <ScheduleComponent
                        ref={scheduleRef}
                        width='100%'
                        height='100%'
                        timezone='Asia/Jerusalem'
                        timeFormat='HH:mm'
                        dateFormat='dd/MM/yyyy'
                        workDays={[0, 1, 2, 3, 4, 5]}
                        locale='he-IL'
                        currentView='Day'
                        eventSettings={{ dataSource: data }}
                        actionComplete={() => {
                            const newRenderedDates = scheduleRef.current?.activeView?.renderDates;
                            if (newRenderedDates) setRenderedDates(newRenderedDates);
                        }}
                        quickInfoTemplates={{ header: GanttQuickInfo as any }} // 'header' type is should be string | Function 
                        enableRtl={true}
                        readonly
                    >
                        <ViewsDirective>
                            <ViewDirective option='Day' eventTemplate={GanttEvent} />
                            <ViewDirective option='Week' eventTemplate={GanttEvent} />
                            <ViewDirective option='Month' eventTemplate={GanttEvent} />
                            <ViewDirective option='TimelineMonth' eventTemplate={GanttEvent} />
                        </ViewsDirective>

                        <ResourcesDirective>
                            <ResourceDirective field='entityTemplateId' title={i18next.t('entityTemplate')} name='entityTemplate' dataSource={resources} />
                        </ResourcesDirective>

                        <Inject services={[TimelineViews, TimelineMonth, Day, Week, Month]} />
                    </ScheduleComponent>
                </Grid>

                <Grid item>
                    <GanttSideBar toggle={() => setSideBarOpen(!sideBarOpen)} open={sideBarOpen} gantt={gantt} />
                </Grid>
            </Grid >
        </>
    );
};

export default GanttPage;
