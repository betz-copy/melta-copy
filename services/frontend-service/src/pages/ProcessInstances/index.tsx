import { Grid } from '@mui/material';
import React, { useState, useCallback } from 'react';
import { useQueryClient } from 'react-query';
import debounce from 'lodash/debounce';
import { IMongoProcessTemplateReviewerPopulated, IProcessTemplateMap } from '@microservices/shared-interfaces';
import ProcessInstancesHeadline from './Headline';
import ProcessesList from './ProcessesList';

const ProcessInstancesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;
    const processTemplates = Array.from(processTemplatesMap.values());

    const [templatesToShowCheckbox, setTemplatesToShowCheckbox] = useState<IMongoProcessTemplateReviewerPopulated[]>(processTemplates);

    const [searchInput, setSearchInput] = useState('');
    const [startDateInput, setStartDateInput] = useState<Date | null>(null);
    const [endDateInput, setEndDateInput] = useState<Date | null>(null);

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
            <Grid container padding="0 4rem" direction="column" marginBottom="2.5rem">
                <ProcessesList
                    search={searchInput}
                    onSetStartDate={onSetStartDate}
                    onSetEndDate={onSetEndDate}
                    templatesToShowCheckbox={templatesToShowCheckbox}
                    startDateInput={startDateInput}
                    endDateInput={endDateInput}
                />
            </Grid>
        </Grid>
    );
};

export default ProcessInstancesPage;
