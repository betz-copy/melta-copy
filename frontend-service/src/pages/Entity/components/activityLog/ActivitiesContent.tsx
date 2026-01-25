import { Grid, InputAdornment, Paper, TextField } from '@mui/material';
import { ActionsLog, IMongoActivityLog } from '@packages/activity-log';
import { IEntityExpanded } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IMongoStepTemplatePopulated, IProcessDetails } from '@packages/process';
import i18next from 'i18next';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { InfiniteScroll } from '../../../../common/InfiniteScroll';
import DateRange from '../../../../common/inputs/DateRange';
import MultipleSelect from '../../../../common/inputs/MultipleSelect';
import { environment } from '../../../../globals';
import { getActivityLogRequest } from '../../../../services/activityLogService';
import { FilterButton } from '../../../SystemManagement/components/FilterButton';
import ActivityLogRow from './ActivityLogRow';

const { infiniteScrollPageCount } = environment.activityLog;

const getNextPageParam = (lastPage: IMongoActivityLog[], allPages: IMongoActivityLog[][]) => {
    const nextPage = allPages.length * infiniteScrollPageCount;
    return lastPage.length ? nextPage : undefined;
};

const ActivitiesContent: React.FC<{
    expandedEntity?: IEntityExpanded;
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated | IProcessDetails | IMongoStepTemplatePopulated;
    activityEntityId?: string;
}> = ({ expandedEntity, entityTemplate, activityEntityId }) => {
    const entityId = expandedEntity?.entity.properties._id || activityEntityId || '';

    const [searchInput, setSearchInput] = useState('');
    const [startDateInput, setStartDateInput] = useState<Date | null>(null);
    const [endDateInput, setEndDateInput] = useState<Date | null>(null);
    const [activitiesFilterValue, setActivitiesFilterValue] = useState<string[] | null>([]);

    const items = [
        { label: i18next.t('entityPage.activityLog.titles.deleteRelationship'), value: ActionsLog.DELETE_RELATIONSHIP },
        { label: i18next.t('entityPage.activityLog.titles.createRelationship'), value: ActionsLog.CREATE_RELATIONSHIP },
        { label: i18next.t('entityPage.activityLog.titles.updateFields'), value: ActionsLog.UPDATE_FIELDS },
        { label: i18next.t('entityPage.activityLog.titles.createEntity'), value: ActionsLog.CREATE_ENTITY },
        { label: i18next.t('entityPage.activityLog.titles.createProcess'), value: ActionsLog.CREATE_PROCESS },
        { label: i18next.t('entityPage.activityLog.titles.duplicateEntity'), value: ActionsLog.DUPLICATE_ENTITY },
        { label: i18next.t('entityPage.activityLog.titles.disableEntity'), value: ActionsLog.DISABLE_ENTITY },
        { label: i18next.t('entityPage.activityLog.titles.enableEntity'), value: ActionsLog.ACTIVATE_ENTITY },
    ];

    let selectedValue: (typeof items)[number] | (typeof items)[number][] | null;

    if (!activitiesFilterValue) {
        selectedValue = [];
    } else {
        selectedValue = items.filter((opt) => activitiesFilterValue.includes(opt.value));
    }

    return (
        <>
            <Grid container flexDirection="column" alignItems="center" marginBottom="20px">
                <Grid
                    sx={{
                        marginBottom: '20px',
                    }}
                >
                    <TextField
                        onChange={(e) => {
                            setSearchInput(e.target.value);
                        }}
                        sx={{ borderRadius: '7px', width: '300px' }}
                        placeholder={i18next.t('globalSearch.searchInHistory')}
                        value={searchInput}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment
                                        position="end"
                                        sx={{
                                            fontWeight: '400',
                                            letterSpacing: '0em',
                                            lineHeight: '16px',
                                            gap: '10px',
                                        }}
                                    >
                                        <img src="/icons/search-gray.svg" alt="search-gray" style={{ alignSelf: 'center', height: '18px' }} />
                                    </InputAdornment>
                                ),
                                startAdornment: <InputAdornment position="start" />,
                            },
                        }}
                    />
                </Grid>
                <Grid width="300px" marginBottom="20px">
                    <MultipleSelect
                        items={items}
                        id="1"
                        disabled={false}
                        readonly={false}
                        multiple
                        selectedValue={selectedValue}
                        onChange={(_event, newVal) => {
                            if (newVal === null) return;
                            setActivitiesFilterValue(Array.isArray(newVal) ? newVal.map((val) => val.value) : [newVal.value]);
                        }}
                        required={false}
                        variant="outlined"
                        label={i18next.t('entityPage.activityLog.activityType')}
                    />
                </Grid>
                <Grid width="300px" marginBottom="10px">
                    <DateRange
                        onStartDateChange={setStartDateInput}
                        onEndDateChange={setEndDateInput}
                        startDateInput={startDateInput}
                        endDateInput={endDateInput}
                        directionIsRow
                        overrideSx={{ spacing: 2 }}
                        borderRadius="20px"
                    />
                </Grid>
                <Grid alignSelf="flex-start" marginLeft="25px">
                    <FilterButton
                        displayIcon={false}
                        disabled={!searchInput && !startDateInput && !endDateInput && (!activitiesFilterValue || !activitiesFilterValue.length)}
                        onClick={() => {
                            setSearchInput('');
                            setStartDateInput(null);
                            setEndDateInput(null);
                            setActivitiesFilterValue(null);
                        }}
                        text={i18next.t('entitiesTableOfTemplate.resetFilters')}
                    />
                </Grid>
            </Grid>
            <InfiniteScroll<IMongoActivityLog>
                queryKey={[
                    'getActivityLogRequest',
                    entityId,
                    searchInput,
                    entityTemplate.properties.properties,
                    activitiesFilterValue,
                    startDateInput,
                    endDateInput,
                ]}
                queryFunction={({ pageParam }) =>
                    getActivityLogRequest(
                        entityId,
                        infiniteScrollPageCount,
                        pageParam,
                        entityTemplate.properties.properties,
                        activitiesFilterValue?.length ? activitiesFilterValue : Object.values(ActionsLog),
                        searchInput.trim(),
                        startDateInput || undefined,
                        endDateInput || undefined,
                    )
                }
                onQueryError={(error) => {
                    console.error('failed to get activities. error:', error);
                    toast.error(i18next.t('entityPage.activityLog.failedToGetActivities'));
                }}
                getNextPageParam={getNextPageParam}
                endText={i18next.t('entityPage.activityLog.noSearchLeft')}
            >
                {(activityLog) => (
                    <Grid key={activityLog._id} padding="15px" marginRight="10px" marginLeft="10px">
                        <Paper sx={{ borderRadius: '20px', boxShadow: '0px 3px 10px 0px rgba(30, 39, 117, 0.1)', width: '300px' }}>
                            <ActivityLogRow log={activityLog} entityTemplate={entityTemplate} />
                        </Paper>
                    </Grid>
                )}
            </InfiniteScroll>
        </>
    );
};

export { ActivitiesContent };
