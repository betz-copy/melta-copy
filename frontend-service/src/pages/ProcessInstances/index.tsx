import { FormControl, FormControlLabel, Grid, Radio, RadioGroup, Typography } from '@mui/material';
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

const ProcessInstancesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;
    const processTemplates = Array.from(processTemplatesMap.values());

    const [templatesToShowCheckbox, setTemplatesToShowCheckbox] = useState<IMongoProcessTemplatePopulated[]>(processTemplates);

    const [searchInput, setSearchInput] = useState('');
    const [startDateInput, setStartDateInput] = useState<Date | null>(null);
    const [endDateInput, setEndDateInput] = useState<Date | null>(null);

    const [statusFilter, setStatusFilter] = useState<'all' | Status | undefined>('all');

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
                <Grid
                    item
                    container
                    flexDirection="column"
                    width="13%"
                    minWidth="250px"
                    height="800px"
                    alignItems="center"
                    rowGap={3}
                    style={{ backgroundColor: 'white', borderRadius: '15px', padding: '10px' }}
                >
                    <Grid container item alignItems="center" justifyContent="space-between" alignContent="center">
                        <Grid container item alignItems="center" width="100px">
                            <FilterListIcon sx={{ color: '#1E2775' }} />
                            <Typography fontSize="16px" fontWeight="600" marginLeft="10px" color="#1E2775" variant="h6">
                                {i18next.t('processInstancesPage.filter')}
                            </Typography>
                        </Grid>
                        <Grid item alignContent="center">
                            <Typography
                                onClick={() => {
                                    onSetStartDate(null);
                                    onSetEndDate(null);
                                    onSearch('');
                                }}
                                textAlign="center"
                                alignContent="center"
                                fontSize="12px"
                                color="#4752B6"
                                sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                            >
                                {i18next.t('processInstancesPage.cleanFilter')}
                            </Typography>
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
                    <Grid item>
                        <ProcessTemplatesSelectCheckbox
                            templates={processTemplates}
                            selectedTemplates={templatesToShowCheckbox}
                            setSelectedTemplates={setTemplatesToShowCheckbox}
                        />
                    </Grid>
                    <Grid item container flexDirection="column">
                        <Grid item>
                            <Typography color="#1E2775" fontSize="14px" fontWeight="500" variant="h6">
                                {i18next.t('wizard.processInstance.summary.processStatus')}
                            </Typography>
                        </Grid>
                        <Grid item>
                            <FormControl>
                                <RadioGroup
                                    aria-labelledby="demo-controlled-radio-buttons-group"
                                    name="controlled-radio-buttons-group"
                                    value={statusFilter}
                                    onChange={(_e, val) => setStatusFilter(val as 'all' | Status | undefined)}
                                >
                                    <FormControlLabel
                                        value="all"
                                        control={<Radio />}
                                        label={
                                            <Typography fontSize="14px" color="#53566E">
                                                {i18next.t('processInstancesPage.allProcesses')}
                                            </Typography>
                                        }
                                    />
                                    <FormControlLabel
                                        value={Status.Pending}
                                        control={<Radio />}
                                        label={
                                            <Typography fontSize="14px" color="#53566E">
                                                {i18next.t('processInstancesPage.pendingProcesses')}
                                            </Typography>
                                        }
                                    />
                                    <FormControlLabel
                                        value={Status.Approved}
                                        control={<Radio />}
                                        label={
                                            <Typography fontSize="14px" color="#53566E">
                                                {i18next.t('processInstancesPage.approvedProcesses')}
                                            </Typography>
                                        }
                                    />
                                    <FormControlLabel
                                        value={Status.Rejected}
                                        control={<Radio />}
                                        label={
                                            <Typography fontSize="14px" color="#53566E">
                                                {i18next.t('processInstancesPage.rejectedProcesses')}
                                            </Typography>
                                        }
                                    />
                                    <FormControlLabel
                                        value={undefined}
                                        control={<Radio />}
                                        label={
                                            <Typography fontSize="14px" color="#53566E">
                                                {i18next.t('processInstancesPage.archivedProcesses')}
                                            </Typography>
                                        }
                                    />
                                </RadioGroup>
                            </FormControl>
                        </Grid>
                        {/* <Grid item>
                            <IconButton sx={{ flexDirection: 'column', width: '60px' }} onClick={() => setStatusFilter('all')}>
                                {statusFilter === 'all' ? (
                                    <StatusIconFilled fontSize="medium" sx={{ color: `${StatusColors.All}` }} />
                                ) : (
                                    <StatusIcon fontSize="medium" sx={{ color: `${StatusColors.All}` }} />
                                )}

                                <Typography variant="subtitle2" fontSize="10px">
                                    {i18next.t('processInstancesPage.allProcesses')}
                                </Typography>
                            </IconButton>
                            <IconButton sx={{ flexDirection: 'column', width: '60px' }} onClick={() => setStatusFilter(Status.Pending)}>
                                {statusFilter === Status.Pending ? (
                                    <StatusIconFilled fontSize="medium" sx={{ color: `${StatusColors.Pending}` }} />
                                ) : (
                                    <StatusIcon fontSize="medium" sx={{ color: `${StatusColors.Pending}` }} />
                                )}

                                <Typography variant="subtitle2" fontSize="10px">
                                    {i18next.t('processInstancesPage.pendingProcesses')}
                                </Typography>
                            </IconButton>
                            <IconButton sx={{ flexDirection: 'column', width: '60px' }} onClick={() => setStatusFilter(Status.Approved)}>
                                {statusFilter === Status.Approved ? (
                                    <StatusIconFilled fontSize="medium" sx={{ color: `${StatusColors.Approved}` }} />
                                ) : (
                                    <StatusIcon fontSize="medium" sx={{ color: `${StatusColors.Approved}` }} />
                                )}
                                <Typography variant="subtitle2" fontSize="10px">
                                    {i18next.t('processInstancesPage.approvedProcesses')}
                                </Typography>
                            </IconButton>
                            <IconButton sx={{ flexDirection: 'column', width: '60px' }} onClick={() => setStatusFilter(Status.Rejected)}>
                                {statusFilter === Status.Rejected ? (
                                    <StatusIconFilled fontSize="medium" sx={{ color: `${StatusColors.Rejected}` }} />
                                ) : (
                                    <StatusIcon fontSize="medium" sx={{ color: `${StatusColors.Rejected}` }} />
                                )}
                                <Typography variant="subtitle2" fontSize="10px">
                                    {i18next.t('processInstancesPage.rejectedProcesses')}
                                </Typography>
                            </IconButton>
                            <IconButton sx={{ flexDirection: 'column', width: '60px' }} onClick={() => setStatusFilter(undefined)}>
                                {!statusFilter ? (
                                    <StatusIconFilled fontSize="medium" sx={{ color: `${StatusColors.Archived}` }} />
                                ) : (
                                    <StatusIcon fontSize="medium" sx={{ color: `${StatusColors.Archived}` }} />
                                )}

                                <Typography variant="subtitle2" fontSize="10px">
                                    {i18next.t('processInstancesPage.archivedProcesses')}
                                </Typography>
                            </IconButton>
                        </Grid> */}
                    </Grid>
                    <Grid item>
                        <Typography color="#1E2775" fontSize="14px" fontWeight="500" variant="h6">
                            {i18next.t('processInstancesPage.dateFilter')}
                        </Typography>
                        <DateRange
                            onStartDateChange={onSetStartDate}
                            onEndDateChange={onSetEndDate}
                            startDateInput={startDateInput}
                            endDateInput={endDateInput}
                            directionIsRow
                        />
                    </Grid>
                </Grid>
                <Grid item container width="80%" direction="column" marginBottom="2.5rem" marginTop="15px">
                    <ProcessesList
                        search={searchInput}
                        onSetStartDate={onSetStartDate}
                        onSetEndDate={onSetEndDate}
                        templatesToShowCheckbox={templatesToShowCheckbox}
                        startDateInput={startDateInput}
                        endDateInput={endDateInput}
                        statusFilter={statusFilter}
                    />
                </Grid>
            </Grid>
        </Grid>
    );
};

export default ProcessInstancesPage;
