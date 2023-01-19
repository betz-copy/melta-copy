import React, { useState } from 'react';
import i18next from 'i18next';
import { Box, CircularProgress, Grid, Typography } from '@mui/material';
import _debounce from 'lodash.debounce';
import { useQuery } from 'react-query';
import pLimit from 'p-limit';
import { useTour } from '@reactour/tour';
import fileDownload from 'js-file-download';
import { toast } from 'react-toastify';
import { IMongoCategory } from '../../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { TemplateTablesHeadline } from './TemplateTablesHeadline';
import TemplateTablesView from './TemplatesTablesView';
import { exportTemplatesToExcelRequest, getEntitiesByTemplateRequest } from '../../services/entitiesService';
import { templatesCompareFunc } from '../../utils/templates';

const getTemplateCount = async (templateId: string, searchInput: string) => {
    const { lastRowIndex } = await getEntitiesByTemplateRequest(templateId, {
        startRow: 0,
        endRow: 0,
        quickFilter: searchInput !== '' ? searchInput : undefined,
        sortModel: [],
        filterModel: {},
    });
    return lastRowIndex;
};

const filterEmptyTemplatesTablesOnGlobalSearchRequest = async (templates: IMongoEntityTemplatePopulated[], searchInput: string) => {
    const pLimitGetTemplateCount = pLimit(10);
    const templatesCountsPromises = templates.map(({ _id }) => pLimitGetTemplateCount(() => getTemplateCount(_id, searchInput)));
    const templatesCounts = await Promise.all(templatesCountsPromises);
    return templates.filter((_template, index) => {
        const count = templatesCounts[index];
        return count > 0;
    });
};

const TemplatesTablesPage: React.FC<{
    templates: IMongoEntityTemplatePopulated[];
    categories?: IMongoCategory[];
    excelExportAllTablesFileName: string;
    pageType: string;
    pageTitle: string;
}> = ({ templates, categories, excelExportAllTablesFileName, pageType, pageTitle }) => {
    const [templatesToShowCheckbox, setTemplatesToShowCheckbox] = useState<IMongoEntityTemplatePopulated[]>(templates);
    const { setSteps } = useTour();
    const { isFetching: isLoadingExcelExport, refetch: exportTemplatesToExcel } = useQuery(
        ['exportTemplatesToExcel', templates.map((template) => template._id), excelExportAllTablesFileName],
        () =>
            exportTemplatesToExcelRequest(
                templates.map((template) => template._id),
                excelExportAllTablesFileName,
            ),
        {
            enabled: false,
            onError(error) {
                console.log('Failed to export tables', error);
                toast.error(i18next.t('failedToExportTables'));
            },
            onSuccess(data) {
                fileDownload(data, excelExportAllTablesFileName);
            },
        },
    );

    const [searchInput, setSearchInput] = useState('');

    const {
        data: templatesFilteredByCount,
        refetch: refetchTemplatesFilteredByCount,
        isFetching: isLoadingTemplatesFilteredByCount,
    } = useQuery(
        ['filterEmptyTemplatesTablesOnGlobalSearch', templatesToShowCheckbox, searchInput],
        () => filterEmptyTemplatesTablesOnGlobalSearchRequest(templatesToShowCheckbox, searchInput),
        {
            onSuccess: (data) => {
                if (data.length === 0 && pageType === 'globalSearch') {
                    // if there are no entities to show in the global search page, stop the tour
                    setSteps!((currSteps) => currSteps.slice(0, 4));
                }
            },
        },
    );

    const onSearch = (newSearchInput: string) => {
        setSearchInput(newSearchInput);
        refetchTemplatesFilteredByCount();
    };

    const templatesFilteredByCountSorted = templatesFilteredByCount?.sort(templatesCompareFunc);

    return (
        <Grid container margin="0vh">
            <Grid item xs={12}>
                <Box marginBottom="3vh" position="sticky" style={{ top: 0, right: 0, zIndex: 1 }}>
                    <TemplateTablesHeadline
                        onSearch={onSearch}
                        entityTemplateSelectCheckboxProps={{
                            categories,
                            templatesToShow: templatesToShowCheckbox,
                            setTemplatesToShow: setTemplatesToShowCheckbox,
                            templates,
                        }}
                        onExcelExport={exportTemplatesToExcel}
                        pageTitle={pageTitle}
                        isLoadingExcel={isLoadingExcelExport}
                    />
                </Box>
                <Grid container padding="0 2.5rem">
                    {isLoadingTemplatesFilteredByCount && <CircularProgress />}
                    {!isLoadingTemplatesFilteredByCount && templatesFilteredByCountSorted?.length === 0 && (
                        <Typography>{i18next.t('noSearchResults')}</Typography>
                    )}
                    {!isLoadingTemplatesFilteredByCount && (
                        <TemplateTablesView templates={templatesFilteredByCountSorted!} searchInput={searchInput} pageType={pageType} />
                    )}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default TemplatesTablesPage;
