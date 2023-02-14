import React, { useState, forwardRef, useImperativeHandle } from 'react';
import _isEqual from 'lodash.isequal';
import { CircularProgress, Divider, Grid, Pagination, Typography } from '@mui/material';
import { useQuery } from 'react-query';
import pLimit from 'p-limit';
import { useTour } from '@reactour/tour';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { TemplateTable } from './TemplateTable';
import { getEntitiesByTemplateRequest } from '../../services/entitiesService';
import { templatesCompareFunc } from '../../utils/templates';

const TemplateTablesViewResults: React.FC<{
    templates: IMongoEntityTemplatePopulated[];
    searchInput: string;
    pageSize?: number;
    pageType: string;
}> = ({ templates, searchInput, pageSize = 10, pageType }) => {
    const [currPage, setCurrPage] = useState(1);
    const countOfPages = Math.ceil(templates.length / pageSize);

    const startOfPageIndex = (currPage - 1) * pageSize;
    const templatesOfPage = templates.slice(startOfPageIndex, startOfPageIndex + pageSize);

    return (
        <Grid container direction="column" spacing={1}>
            {templatesOfPage.map((template) => (
                <Grid item key={template._id}>
                    <TemplateTable template={template} quickFilterText={searchInput} page={pageType} />
                </Grid>
            ))}
            <Grid item>
                <Divider />
            </Grid>
            <Grid item alignSelf="center" margin={2}>
                <Pagination
                    page={currPage}
                    onChange={(_e, page) => setCurrPage(page)}
                    count={countOfPages}
                    size="large"
                    showFirstButton
                    showLastButton
                />
            </Grid>
        </Grid>
    );
};

const getTemplateCount = async (templateId: string, searchInput: string) => {
    const { lastRowIndex } = await getEntitiesByTemplateRequest([templateId], {
        startRow: 0,
        endRow: 0,
        quickFilter: searchInput !== '' ? searchInput : undefined,
        sortModel: [],
        filterModel: {},
    });
    return lastRowIndex;
};

const filterEmptyTemplateTablesOnGlobalSearchRequest = async (templates: IMongoEntityTemplatePopulated[], searchInput: string) => {
    const pLimitGetTemplateCount = pLimit(10);
    const templatesCountsPromises = templates.map(({ _id }) => pLimitGetTemplateCount(() => getTemplateCount(_id, searchInput)));
    const templatesCounts = await Promise.all(templatesCountsPromises);
    return templates.filter((_template, index) => {
        const count = templatesCounts[index];
        return count > 0;
    });
};

export interface TemplateTablesViewProps {
    templates: IMongoEntityTemplatePopulated[];
    searchInput: string;
    pageType: string;
}

export interface TemplateTablesViewRef {
    refetch: () => void;
}

const TemplateTablesView = forwardRef<TemplateTablesViewRef, TemplateTablesViewProps>(({ templates, searchInput, pageType }, ref) => {
    const { setSteps } = useTour();

    const {
        data: templatesFilteredByCount,
        refetch: refetchTemplatesFilteredByCount,
        isFetching: isLoadingTemplatesFilteredByCount,
    } = useQuery(
        ['filterEmptyTemplateTablesOnGlobalSearch', templates, searchInput],
        () => filterEmptyTemplateTablesOnGlobalSearchRequest(templates, searchInput),
        {
            onSuccess: (data) => {
                if (data.length === 0 && pageType === 'globalSearch') {
                    // if there are no entities to show in the global search page, stop the tour
                    setSteps!((currSteps) => currSteps.slice(0, 4));
                }
            },
            onError(error) {
                console.log('Failed to load templates counts', error);
                toast.error(i18next.t('entitiesTableOfTemplate.failedToLoadData'));
            },
        },
    );

    useImperativeHandle(ref, () => ({
        refetch: refetchTemplatesFilteredByCount,
    }));

    const templatesFilteredByCountSorted = templatesFilteredByCount?.sort(templatesCompareFunc);

    return (
        <Grid container>
            {isLoadingTemplatesFilteredByCount && (
                <Grid container justifyContent="center">
                    <CircularProgress />
                </Grid>
            )}
            {!isLoadingTemplatesFilteredByCount && templatesFilteredByCountSorted?.length === 0 && (
                <Typography>{i18next.t('noSearchResults')}</Typography>
            )}
            {!isLoadingTemplatesFilteredByCount && templatesFilteredByCountSorted && (
                <TemplateTablesViewResults templates={templatesFilteredByCountSorted} searchInput={searchInput} pageType={pageType} />
            )}
        </Grid>
    );
});

export default TemplateTablesView;
