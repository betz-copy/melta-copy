import { CircularProgress, Grid } from '@mui/material';
import React from 'react';
import { Check, Close, Gavel } from '@mui/icons-material';
import i18next from 'i18next';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { EntitiesTable } from './EntitiesTable';
import { IEntity } from '../../../../interfaces/entities';
import { ITablesResults } from '../../../../interfaces/excel';

export const LoadEntitiesTables: React.FC<{
    tablesData: ITablesResults;
    template: IMongoEntityTemplatePopulated;
    onDownload?: (brokenRulesEntities?: boolean) => Promise<any>;
    isLoadingDownload?: boolean;
    isLoadingTables?: boolean;
    brokenRulesEntities?: any[];
}> = ({ tablesData, template, onDownload, isLoadingDownload, isLoadingTables, brokenRulesEntities }) => {
    const isFailedEntities = tablesData.failedEntities.length > 0;
    const isBrokenRulesEntities = (tablesData.brokenRulesEntities?.entities?.length ?? 0) > 0 || (brokenRulesEntities?.length ?? 0) > 0;

    if (isLoadingTables) return <CircularProgress style={{ marginTop: '10px', margin: 'auto' }} />;
    console.log({ brokenRulesEntities });

    return (
        // TODO maybe map this
        <Grid container direction="column" padding="5px" paddingY="15px">
            <EntitiesTable
                rowData={tablesData.succeededEntities as IEntity[]}
                template={template}
                defaultExpanded={false}
                icon={<Check sx={{ color: '#4FC318' }} />}
                title={`${tablesData.succeededEntities.length} ${i18next.t('wizard.entity.loadEntities.succeededEntities')}`}
            />
            <EntitiesTable
                rowData={brokenRulesEntities || (tablesData.brokenRulesEntities?.entities as IEntity[]) || []}
                template={template}
                defaultExpanded={isBrokenRulesEntities}
                icon={<Gavel style={{ color: '#FFAC2F' }} />}
                title={`${brokenRulesEntities?.length || tablesData.brokenRulesEntities?.entities?.length || 0} ${i18next.t(
                    'wizard.entity.loadEntities.brokenRulesEntities',
                )}`}
                description={i18next.t('wizard.entity.loadEntities.brokenRulesEntitiesDescription')}
                download={onDownload && isLoadingDownload ? { onDownload: () => onDownload(true), isLoading: isLoadingDownload } : undefined}
            />
            <EntitiesTable
                rowData={tablesData.failedEntities}
                template={template}
                defaultExpanded={isFailedEntities}
                icon={<Close sx={{ color: '#A40000' }} />}
                title={`${tablesData.failedEntities.length} ${i18next.t('wizard.entity.loadEntities.failedEntities')}`}
                description={i18next.t('wizard.entity.loadEntities.failedEntitiesDescription')}
                download={onDownload && isLoadingDownload ? { onDownload: () => onDownload(false), isLoading: isLoadingDownload } : undefined}
            />
        </Grid>
    );
};
