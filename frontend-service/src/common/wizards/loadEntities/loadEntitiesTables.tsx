import { Grid } from '@mui/material';
import React from 'react';
import { Check, Close, Gavel } from '@mui/icons-material';
import i18next from 'i18next';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ITablesResults } from '.';
import { EntitiesTable } from './EntitiesTable';

export const LoadEntitiesTables: React.FC<{
    tablesData: ITablesResults;
    template: IMongoEntityTemplatePopulated;
    onDownload: (brokenRulesEntities?: boolean) => Promise<any>;
    isLoading: boolean;
}> = ({ tablesData, template, onDownload, isLoading }) => {
    const isFailedEntities = tablesData.failedEntities.length > 0;
    const isBrokenRulesEntities = (tablesData.brokenRulesEntities?.entities?.length ?? 0) > 0;
    return (
        <Grid container direction="column" padding="5px" paddingY="15px">
            <EntitiesTable
                rowData={tablesData.succeededEntities}
                template={template}
                defaultExpanded={false}
                icon={<Check sx={{ color: '#4FC318' }} />}
                title={`${tablesData.succeededEntities.length} ${i18next.t('wizard.entity.loadEntities.succeededEntities')}`}
            />
            <EntitiesTable
                rowData={tablesData.brokenRulesEntities?.entities || []}
                template={template}
                defaultExpanded={isBrokenRulesEntities}
                icon={<Gavel style={{ color: '#FFAC2F' }} />}
                title={`${tablesData.brokenRulesEntities?.entities.length || 0} ${i18next.t('wizard.entity.loadEntities.brokenRulesEntities')}`}
                description={isBrokenRulesEntities ? i18next.t('wizard.entity.loadEntities.brokenRulesEntitiesDescription') : undefined}
                download={isBrokenRulesEntities ? { onDownload: () => onDownload(true), isLoading } : undefined}
            />
            <EntitiesTable
                rowData={tablesData.failedEntities}
                template={template}
                defaultExpanded={isFailedEntities}
                icon={<Close sx={{ color: '#A40000' }} />}
                title={`${tablesData.failedEntities.length} ${i18next.t('wizard.entity.loadEntities.failedEntities')}`}
                description={i18next.t('wizard.entity.loadEntities.failedEntitiesDescription')}
                download={isFailedEntities ? { onDownload: () => onDownload(false), isLoading } : undefined}
            />
        </Grid>
    );
};
