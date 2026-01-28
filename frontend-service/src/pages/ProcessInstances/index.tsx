import { FilterList, Search } from '@mui/icons-material';
import { Box, FormControl, FormControlLabel, Grid, IconButton, Paper, Radio, RadioGroup, useTheme } from '@mui/material';
import { IMongoProcessTemplateReviewerPopulated, Status } from '@packages/process';
import i18next from 'i18next';
import debounce from 'lodash/debounce';
import React, { useCallback, useState } from 'react';
import { useQueryClient } from 'react-query';
import DateRange from '../../common/inputs/DateRange';
import SearchInput from '../../common/inputs/SearchInput';
import BlueTitle from '../../common/MeltaDesigns/BlueTitle';
import MeltaCheckbox from '../../common/MeltaDesigns/MeltaCheckbox';
import { IProcessTemplateMap } from '../../interfaces/template';
import ProcessInstancesHeadline from './Headline';
import ProcessesList from './ProcessesList';
import ProcessTemplatesSelectCheckbox from './ProcessTemplatesCheckbox';

const ProcessInstancesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;
    const processTemplates = Array.from(processTemplatesMap.values());

    const [templatesToShowCheckbox, setTemplatesToShowCheckbox] = useState<IMongoProcessTemplateReviewerPopulated[]>(processTemplates);

    const [searchInput, setSearchInput] = useState('');
    const [startDateInput, setStartDateInput] = useState<Date | null>(null);
    const [endDateInput, setEndDateInput] = useState<Date | null>(null);

    const [statusFilter, setStatusFilter] = useState<'all' | Status | 'archived'>('all');
    const [isWaitingForMeFilterOn, setIsWaitingForMeFilterOn] = useState<boolean>(true);

    const onSearch = useCallback(
        debounce((newSearchInput: string) => {
            setSearchInput(newSearchInput);
        }, 150),
        [],
    );
    const onSetStartDate = (newStartDateInput: Date | null) => {
        setStartDateInput(newStartDateInput);
    };
    const onSetEndDate = (newEndDateInput: Date | null) => {
        setEndDateInput(newEndDateInput);
    };

    const theme = useTheme();

    const resetFilters = () => {
        onSetStartDate(null);
        onSetEndDate(null);
        setSearchInput('');
        setIsWaitingForMeFilterOn(false);
        setStatusFilter('all');
        setTemplatesToShowCheckbox(processTemplates);
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
            <Grid container justifyContent="space-evenly">
                <Paper
                    sx={{
                        borderRadius: '15px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '13%',
                        minWidth: '250px',
                        height: '610px',
                        alignItems: 'center',
                    }}
                >
                    <Grid container flexDirection="column" rowGap={3}>
                        <Grid container alignItems="center" justifyContent="space-between" alignContent="center">
                            <Grid container alignItems="center" width="100px">
                                <IconButton disabled>
                                    <FilterList color="primary" />
                                </IconButton>
                                <BlueTitle
                                    component="h4"
                                    variant="h6"
                                    style={{ fontSize: '16px', fontWeight: '600', marginLeft: '10px' }}
                                    title={i18next.t('processInstancesPage.filter')}
                                />
                            </Grid>
                            <Grid alignContent="center" onClick={resetFilters}>
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
                        <Grid sx={{ borderRadius: '7px', width: 'fit-content', boxShadow: '3' }}>
                            <SearchInput
                                onChange={setSearchInput}
                                borderRadius="7px"
                                placeholder={i18next.t('globalSearch.searchProcesses')}
                                value={searchInput}
                                endAdornmentChildren={
                                    <Box>
                                        <IconButton sx={{ color: theme.palette.primary.main, padding: 0 }} disableRipple>
                                            <Search sx={{ fontSize: '1.25rem' }} />
                                        </IconButton>
                                    </Box>
                                }
                                toTopBar={false}
                            />
                        </Grid>
                        <Grid sx={{ borderRadius: '7px', width: 'fit-content', boxShadow: '3' }}>
                            <ProcessTemplatesSelectCheckbox
                                templates={processTemplates}
                                selectedTemplates={templatesToShowCheckbox}
                                setSelectedTemplates={setTemplatesToShowCheckbox}
                            />
                        </Grid>
                        <Grid container alignItems="center">
                            <Grid>
                                <MeltaCheckbox checked={isWaitingForMeFilterOn} onChange={(_e, checked) => setIsWaitingForMeFilterOn(checked)} />
                            </Grid>
                            <Grid>
                                <BlueTitle
                                    style={{ fontSize: '14px', fontWeight: '400' }}
                                    component="h4"
                                    variant="h6"
                                    title={i18next.t('processInstancesPage.groupByWaitingForMe')}
                                />
                            </Grid>
                        </Grid>
                        <Grid container flexDirection="column">
                            <Grid>
                                <BlueTitle
                                    style={{ fontSize: '15px', fontWeight: '500' }}
                                    component="h4"
                                    variant="h6"
                                    title={i18next.t('wizard.processInstance.summary.processStatus')}
                                />
                            </Grid>
                            <Grid>
                                <FormControl>
                                    <RadioGroup
                                        aria-labelledby="demo-controlled-radio-buttons-group"
                                        name="controlled-radio-buttons-group"
                                        value={statusFilter}
                                        onChange={(_e, val) => setStatusFilter(val as 'all' | Status | 'archived')}
                                    >
                                        {['all', Status.Pending, Status.Approved, Status.Rejected, 'archived'].map((val) => (
                                            <FormControlLabel
                                                key={val}
                                                value={val}
                                                control={<Radio />}
                                                onChange={(_e, checked) => {
                                                    if (checked) setIsWaitingForMeFilterOn(false);
                                                }}
                                                label={
                                                    <BlueTitle
                                                        style={{ fontSize: '14px', fontWeight: 400 }}
                                                        component="h4"
                                                        variant="h6"
                                                        title={i18next.t(`processInstancesPage.${val}Processes`)}
                                                    />
                                                }
                                            />
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                            </Grid>
                        </Grid>
                        <Grid>
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
                <Grid container width="80%" direction="column" marginBottom="2.5rem">
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
