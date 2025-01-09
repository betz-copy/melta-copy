import { Checkbox, FormControl, FormControlLabel, Grid, IconButton, Paper, Radio, RadioGroup, Typography } from '@mui/material';
import React, { useState, useCallback } from 'react';
import { useQueryClient } from 'react-query';
import debounce from 'lodash/debounce';
import FilterListIcon from '@mui/icons-material/FilterList';
import i18next from 'i18next';
import ProcessInstancesHeadline from './Headline';
import ProcessesList from './ProcessesList';
import { IMongoProcessTemplatePopulated, IProcessTemplateMap } from '../../interfaces/processes/processTemplate';
import ProcessTemplatesSelectCheckbox from './ProcessTemplatesCheckbox';
import { GlobalSearchBar } from '../../common/EntitiesPage/Headline';
import DateRange from '../../common/inputs/DateRange';
import { Status } from '../../interfaces/processes/processInstance';
import { BlueTitle } from '../../common/BlueTitle';

const ProcessInstancesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;
    const processTemplates = Array.from(processTemplatesMap.values());

    const [templatesToShowCheckbox, setTemplatesToShowCheckbox] = useState<IMongoProcessTemplatePopulated[]>(processTemplates);

    const [searchInput, setSearchInput] = useState('');
    const [startDateInput, setStartDateInput] = useState<Date | null>(null);
    const [endDateInput, setEndDateInput] = useState<Date | null>(null);

    const [statusFilter, setStatusFilter] = useState<'all' | Status | 'archived'>('all');
    const [isWaitingForMeFilterOn, setIsWaitingForMeFilterOn] = useState<boolean>(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onSearch = useCallback(
        debounce((newSearchInput: string) => {
            setSearchInput(newSearchInput);
        }, 150),
        [searchInput],
    );
    const onSetStartDate = (newStartDateInput: Date | null) => {
        setStartDateInput(newStartDateInput);
    };
    const onSetEndDate = (newEndDateInput: Date | null) => {
        setEndDateInput(newEndDateInput);
    };

    return (
        <Grid>
            <ProcessInstancesHeadline
                onSearch={onSearch}
                onSetStartDate={onSetStartDate}
                onSetEndDate={onSetEndDate}
                templatesSelectCheckboxProps={{
                    templates: processTemplates,
                    templatesToShow: templatesToShowCheckbox,
                    setTemplatesToShow: setTemplatesToShowCheckbox,
                }}
                startDateInput={startDateInput}
                endDateInput={endDateInput}
                searchInput={searchInput}
            />
            <Grid item container justifyContent="space-evenly">
                <Paper
                    style={{
                        borderRadius: '15px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '13%',
                        minWidth: '250px',
                        height: '800px',
                        alignItems: 'center',
                    }}
                >
                    <Grid item container flexDirection="column" rowGap={3}>
                        <Grid container item alignItems="center" justifyContent="space-between" alignContent="center">
                            <Grid container item alignItems="center" width="100px">
                                <IconButton disabled>
                                    <FilterListIcon />
                                </IconButton>
                                <BlueTitle
                                    component="h4"
                                    variant="h6"
                                    style={{ fontSize: '16px', fontWeight: '600', marginLeft: '10px' }}
                                    title={i18next.t('processInstancesPage.filter')}
                                />
                            </Grid>
                            <Grid
                                item
                                alignContent="center"
                                onClick={() => {
                                    onSetStartDate(null);
                                    onSetEndDate(null);
                                    onSearch('');
                                }}
                            >
                                <BlueTitle
                                    component="h4"
                                    variant="h6"
                                    style={{
                                        textAlign: 'center',
                                        alignContent: 'center',
                                        fontSize: '12px',
                                        textDecoration: 'underline',
                                        cursor: 'pointer',
                                    }}
                                    title={i18next.t('processInstancesPage.cleanFilter')}
                                />
                            </Grid>
                        </Grid>
                        <Grid item sx={{ borderRadius: '7px', width: 'fit-content', boxShadow: '3' }}>
                            <GlobalSearchBar
                                inputValue={searchInput}
                                setInputValue={onSearch}
                                onSearch={onSearch}
                                borderRadius="7px"
                                placeholder={i18next.t('globalSearch.searchInPage')}
                                toTopBar={false}
                            />
                        </Grid>
                        <Grid item sx={{ borderRadius: '7px', width: 'fit-content', boxShadow: '3' }}>
                            <ProcessTemplatesSelectCheckbox
                                templates={processTemplates}
                                selectedTemplates={templatesToShowCheckbox}
                                setSelectedTemplates={setTemplatesToShowCheckbox}
                            />
                        </Grid>
                        <Grid container item alignItems="center">
                            <Grid item>
                                <Checkbox checked={isWaitingForMeFilterOn} onChange={(_e, checked) => setIsWaitingForMeFilterOn(checked)} />
                            </Grid>
                            <Grid item>
                                <BlueTitle
                                    style={{ fontSize: '14px', fontWeight: '400' }}
                                    component="h4"
                                    variant="h6"
                                    title={i18next.t('processInstancesPage.groupByWaitingForMe')}
                                />
                            </Grid>
                        </Grid>
                        <Grid item container flexDirection="column">
                            <Grid item>
                                <BlueTitle
                                    style={{ fontSize: '15px', fontWeight: '500' }}
                                    component="h4"
                                    variant="h6"
                                    title={i18next.t('wizard.processInstance.summary.processStatus')}
                                />
                            </Grid>
                            <Grid item>
                                <FormControl>
                                    <RadioGroup
                                        aria-labelledby="demo-controlled-radio-buttons-group"
                                        name="controlled-radio-buttons-group"
                                        value={statusFilter}
                                        onChange={(_e, val) => setStatusFilter(val as 'all' | Status | 'archived')}
                                    >
                                        <FormControlLabel
                                            value="all"
                                            control={<Radio />}
                                            label={
                                                <BlueTitle
                                                    style={{ fontSize: '14px', fontWeight: 400 }}
                                                    component="h4"
                                                    variant="h6"
                                                    title={i18next.t('processInstancesPage.allProcesses')}
                                                />
                                            }
                                        />
                                        <FormControlLabel
                                            value={Status.Pending}
                                            control={<Radio />}
                                            label={
                                                <BlueTitle
                                                    style={{ fontSize: '14px', fontWeight: 400 }}
                                                    component="h4"
                                                    variant="h6"
                                                    title={i18next.t('processInstancesPage.pendingProcesses')}
                                                />
                                            }
                                        />
                                        <FormControlLabel
                                            value={Status.Approved}
                                            control={<Radio />}
                                            label={
                                                <BlueTitle
                                                    style={{ fontSize: '14px', fontWeight: 400 }}
                                                    component="h4"
                                                    variant="h6"
                                                    title={i18next.t('processInstancesPage.approvedProcesses')}
                                                />
                                            }
                                        />
                                        <FormControlLabel
                                            value={Status.Rejected}
                                            control={<Radio />}
                                            label={
                                                <BlueTitle
                                                    style={{ fontSize: '14px', fontWeight: 400 }}
                                                    component="h4"
                                                    variant="h6"
                                                    title={i18next.t('processInstancesPage.rejectedProcesses')}
                                                />
                                            }
                                        />
                                        <FormControlLabel
                                            value="archived"
                                            control={<Radio />}
                                            label={
                                                <BlueTitle
                                                    style={{ fontSize: '14px', fontWeight: 400 }}
                                                    component="h4"
                                                    variant="h6"
                                                    title={i18next.t('processInstancesPage.archivedProcesses')}
                                                />
                                            }
                                        />
                                    </RadioGroup>
                                </FormControl>
                            </Grid>
                        </Grid>
                        <Grid item>
                            <BlueTitle
                                component="h4"
                                variant="h6"
                                style={{ fontSize: '14px', fontWeight: '500' }}
                                title={i18next.t('processInstancesPage.dateFilter')}
                            />
                            <DateRange
                                onStartDateChange={onSetStartDate}
                                onEndDateChange={onSetEndDate}
                                startDateInput={startDateInput}
                                endDateInput={endDateInput}
                                directionIsRow
                            />
                        </Grid>
                    </Grid>
                </Paper>
                <Grid item container width="80%" direction="column" marginBottom="2.5rem">
                    <ProcessesList
                        search={searchInput}
                        onSetStartDate={onSetStartDate}
                        onSetEndDate={onSetEndDate}
                        templatesToShowCheckbox={templatesToShowCheckbox}
                        startDateInput={startDateInput}
                        endDateInput={endDateInput}
                        statusFilter={statusFilter}
                        isWaitingForMeFilterOn={isWaitingForMeFilterOn}
                    />
                </Grid>
            </Grid>
        </Grid>
    );
};

export default ProcessInstancesPage;
