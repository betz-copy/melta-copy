import { CircularProgress, Grid } from '@mui/material';
import { L10n, loadCldr } from '@syncfusion/ej2-base'; // eslint-disable-line import/no-extraneous-dependencies
import {
    Day,
    EventRenderedArgs,
    Inject,
    Month,
    NavigatingEventArgs,
    ResourceDirective,
    ResourcesDirective,
    ScheduleComponent,
    TimelineMonth,
    TimelineViews,
    View,
    ViewDirective,
    ViewsDirective,
    Week,
} from '@syncfusion/ej2-react-schedule';
import i18next from 'i18next';
import flatten from 'lodash.flatten';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useInfiniteQuery, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import caHebrew from '../../CLDR/hebrew/ca-hebrew.json';
import numberingSystems from '../../CLDR/hebrew/numberingSystems.json';
import numbers from '../../CLDR/hebrew/numbers.json';
import timeZoneNames from '../../CLDR/hebrew/timeZoneNames.json';
import darkTheme from '../../css/syncfusion/dark.css?inline'; // eslint-disable-line import/no-unresolved
import lightTheme from '../../css/syncfusion/light.css?inline'; // eslint-disable-line import/no-unresolved
import '../../css/syncfusion/schedule.css';
import { environment } from '../../globals';
import hebrew from '../../i18n/hebrew';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { IGantt } from '../../interfaces/gantts';
import { getEntitiesWithDirectConnections } from '../../services/entitiesService';
import { useDarkModeStore } from '../../stores/darkMode';
import {
    getEntitiesSearchBody,
    getScheduleComponentData,
    getScheduleComponentEntityTemplateResourceData,
    getScheduleComponentGroupByEntityResourceData,
} from '../../utils/gantts';
import { useDynamicStyleSheet } from '../../utils/hooks/useDynamicStyleSheet';
import { useSearchParams } from '../../utils/hooks/useSearchParams';
import { GanttEvent } from './GanttEvent';
import { GanttQuickInfo } from './GanttQuickInfo';
import { Heatmap } from './Heatmap';
import { ScheduleToolbar } from './ScheduleToolbar';

loadCldr(numberingSystems, caHebrew, timeZoneNames, numbers);
L10n.load({ 'he-IL': hebrew.schedule });

const {
    refetchInterval,
    ganttEntitiesChunkSize,
    searchParams: { selectedViewKey, selectedDateKey, heatmapModeKey },
} = environment.ganttSettings;

interface IGanttProps {
    gantt: IGantt;
}

export const Gantt: React.FC<IGanttProps> = ({ gantt }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    useDynamicStyleSheet(darkMode ? darkTheme : lightTheme);

    const scheduleRef = useRef<ScheduleComponent>(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const selectedView = (searchParams.get(selectedViewKey) as View) || 'Month';
    const selectedDate = searchParams.get(selectedDateKey) || new Date().toISOString();

    const heatmapMode = Boolean(searchParams.get(heatmapModeKey));

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const [renderedDates, setRenderedDates] = useState<Date[]>([]);

    const entityTemplateResources = useMemo(
        () => getScheduleComponentEntityTemplateResourceData(gantt.items, entityTemplates),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [gantt, entityTemplates],
    );
    const { data: groupByEntityResources } = useQuery(
        ['groupByEntities', gantt.groupBy],
        async () => gantt.groupBy && getScheduleComponentGroupByEntityResourceData(gantt.groupBy),
        { refetchInterval },
    );

    const {
        data: pagedData,
        fetchNextPage,
        hasNextPage,
        isLoading,
    } = useInfiniteQuery(
        ['getGanttEntities', gantt, renderedDates, entityTemplates],
        async ({ pageParam }) => {
            if (!renderedDates.length || !gantt.items.length) return [];

            const searchBody = getEntitiesSearchBody(
                gantt.items,
                renderedDates[0],
                renderedDates[renderedDates.length - 1],
                ganttEntitiesChunkSize,
                pageParam,
                entityTemplates,
                heatmapMode,
            );
            const { entities } = await getEntitiesWithDirectConnections(searchBody);

            return getScheduleComponentData(entities, gantt.items, entityTemplates);
        },
        {
            getNextPageParam: (lastPage, allPages) => {
                const nextPage = allPages.length * ganttEntitiesChunkSize;
                return lastPage.length ? nextPage : undefined;
            },
            onError: (error) => {
                console.error('failed to get entities. error:', error);
                toast.error(i18next.t('gantts.failedToGetEntities'));
            },
            refetchInterval,
        },
    );

    const data = useMemo(() => {
        if (hasNextPage) fetchNextPage();

        if (pagedData) return flatten(pagedData.pages);
        return [];
    }, [pagedData]); // eslint-disable-line react-hooks/exhaustive-deps

    const injectToolbar = () => {
        document.getElementById('scheduleToolbar')?.remove();

        const toolbar = document.createElement('div');
        toolbar.id = 'scheduleToolbar';

        const [toolbarContainer] = document.getElementsByClassName('e-schedule-toolbar-container');
        if (!toolbarContainer?.parentNode) return;
        toolbarContainer.parentNode.insertBefore(toolbar, toolbarContainer.parentNode.firstChild);

        const root = createRoot(toolbar);
        root.render(<ScheduleToolbar scheduleRef={scheduleRef} darkMode={darkMode} />);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => injectToolbar(), [darkMode]);

    return (
        <>
            {(isLoading || hasNextPage) && (
                <Grid
                    container
                    alignItems="center"
                    justifyContent="space-around"
                    position="absolute"
                    bgcolor="rgba(0,0,0,0.2)"
                    width="100%"
                    height="100%"
                    zIndex={100}
                >
                    <CircularProgress />
                </Grid>
            )}

            {heatmapMode ? (
                <Heatmap ganttEvents={data} groupByEntityResources={groupByEntityResources} onInit={() => setRenderedDates([new Date()])} />
            ) : (
                <ScheduleComponent
                    ref={scheduleRef}
                    width="100%"
                    height="100%"
                    timezone="Asia/Jerusalem"
                    timeFormat="HH:mm"
                    dateFormat="dd/MM/yyyy"
                    workDays={[0, 1, 2, 3, 4, 5]}
                    locale="he-IL"
                    selectedDate={new Date(selectedDate)}
                    currentView={selectedView}
                    eventSettings={{ dataSource: data }}
                    navigating={(event: NavigatingEventArgs) => {
                        const { currentView, currentDate } = event;
                        setSearchParams({
                            [selectedViewKey]: currentView || selectedView,
                            [selectedDateKey]: currentDate?.toISOString() || selectedDate,
                        });
                    }}
                    dataBinding={() => {
                        if (!scheduleRef.current) return;
                        setRenderedDates(scheduleRef.current.activeView.renderDates);

                        injectToolbar();
                    }}
                    eventRendered={(event: EventRenderedArgs) => {
                        // when grouping by a resource the schedule component will try to color the events only by the resource's colors even if there are none
                        // so when grouping by the 'groupByEntity' we override the color to be according to the entityTemplate resource
                        if (!gantt.groupBy) return;
                        const entityTemplateResource = entityTemplateResources.find((resource) => resource.Id === event.data.entityTemplateId);
                        if (entityTemplateResource?.Color) event.element.style.backgroundColor = entityTemplateResource.Color; // eslint-disable-line no-param-reassign
                    }}
                    quickInfoTemplates={{ header: GanttQuickInfo as any }} // 'header' type should be `string | Function`
                    group={{ resources: gantt.groupBy ? ['groupByEntity'] : [] }}
                    enableAdaptiveUI
                    rowAutoHeight
                    enableRtl
                    readonly
                >
                    <ViewsDirective>
                        <ViewDirective option="Day" eventTemplate={GanttEvent} />
                        <ViewDirective option="Week" eventTemplate={GanttEvent} />
                        <ViewDirective option="Month" eventTemplate={GanttEvent} />
                        <ViewDirective option="TimelineMonth" eventTemplate={GanttEvent} />
                    </ViewsDirective>

                    <ResourcesDirective>
                        <ResourceDirective
                            field="entityTemplateId"
                            title={i18next.t('entityTemplate')}
                            name="entityTemplate"
                            dataSource={entityTemplateResources}
                        />
                        {gantt.groupBy && (
                            <ResourceDirective
                                field="groupedByEntityIds"
                                title={i18next.t('gantts.groupByEntities')}
                                name="groupByEntity"
                                dataSource={groupByEntityResources}
                                allowMultiple
                            />
                        )}
                    </ResourcesDirective>

                    <Inject services={[TimelineViews, TimelineMonth, Day, Week, Month]} />
                </ScheduleComponent>
            )}
        </>
    );
};
