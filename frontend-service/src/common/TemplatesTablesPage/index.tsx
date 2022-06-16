import React, { useRef, useState } from 'react';
import i18next from 'i18next';
import { Box, CircularProgress, Grid, Typography } from '@mui/material';
import _debounce from 'lodash.debounce';
import { useQuery } from 'react-query';
import { IMongoCategory } from '../../interfaces/categories';

import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { TemplateTablesHeadline } from './TemplateTablesHeadline';
import TemplateTablesView from './TemplatesTablesView';
import { getEntitiesByTemplateRequest } from '../../services/entitiesService';

const getTemplateCount = async (templateId: string, searchInput: string) => {
    const { lastRowIndex } = await getEntitiesByTemplateRequest(templateId, {
        startRow: 0,
        endRow: 0,
        quickFilter: searchInput,
        sortModel: [],
        filterModel: {},
    });
    return lastRowIndex;
};

const filterEmptyTemplatesTablesOnGlobalSearchRequest = async (templates: IMongoEntityTemplatePopulated[], searchInput: string) => {
    const templatesCountsPromises = templates.map(({ _id }) => getTemplateCount(_id, searchInput));
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
}> = ({ templates, categories, excelExportAllTablesFileName }) => {
    const [templatesToShowCheckbox, setTemplatesToShowCheckbox] = useState<IMongoEntityTemplatePopulated[]>(templates);

    const templatesTablesRef = useRef<React.ComponentRef<typeof TemplateTablesView>>(null);

    const onExcelExportTables = () => {
        templatesTablesRef.current?.onExcelExportTables(excelExportAllTablesFileName);
    };

    const [searchInput, setSearchInput] = useState('');

    const {
        data: templatesFilteredByCount,
        refetch: refetchTemplatesFilteredByCount,
        isFetching: isLoadingTemplatesFilteredByCount,
    } = useQuery(['filterEmptyTemplatesTablesOnGlobalSearch', templatesToShowCheckbox, searchInput], () =>
        filterEmptyTemplatesTablesOnGlobalSearchRequest(templatesToShowCheckbox, searchInput),
    );

    const onSearch = (newSearchInput: string) => {
        setSearchInput(newSearchInput);
        refetchTemplatesFilteredByCount();
    };

    return (
        <Grid container>
            <Grid item xs={12}>
                <Box marginBottom="3vh">
                    <TemplateTablesHeadline
                        onSearch={onSearch}
                        entityTemplateSelectCheckboxProps={{
                            categories,
                            templatesToShow: templatesToShowCheckbox,
                            setTemplatesToShow: setTemplatesToShowCheckbox,
                            templates,
                        }}
                        onExcelExport={onExcelExportTables}
                    />
                </Box>
                <Grid container>
                    {isLoadingTemplatesFilteredByCount && <CircularProgress />}
                    {!isLoadingTemplatesFilteredByCount && templatesFilteredByCount?.length === 0 && (
                        <Typography>{i18next.t('noSearchResults')}</Typography>
                    )}
                    {!isLoadingTemplatesFilteredByCount && (
                        <TemplateTablesView ref={templatesTablesRef} templates={templatesFilteredByCount!} searchInput={searchInput} />
                    )}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default TemplatesTablesPage;
