import { Check, Close, Gavel } from '@mui/icons-material';
import { CircularProgress, Grid } from '@mui/material';
import { IEntity } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import i18next from 'i18next';
import React from 'react';
import { IStatusEntitiesTables } from '../../../../interfaces/excel';
import { EntitiesTable } from './EntitiesTable';

export const StatusEntitiesTables: React.FC<{
    tablesData: IStatusEntitiesTables;
    template: IMongoEntityTemplateWithConstraintsPopulated;
    onDownload?: (brokenRulesEntities?: boolean) => Promise<any>;
    isLoadingDownload?: boolean;
    isLoadingTables?: boolean;
}> = ({ tablesData, template, onDownload, isLoadingDownload, isLoadingTables }) => {
    const isFailedEntities = tablesData.failedEntities.length > 0;
    const isBrokenRulesEntities = (tablesData.brokenRulesEntities?.length ?? 0) > 0;

    if (isLoadingTables) return <CircularProgress style={{ marginTop: '10px', margin: 'auto' }} />;

    return (
        <Grid container direction="column" padding="5px" paddingY="15px" width="100%">
            <EntitiesTable
                rowData={tablesData.succeededEntities as IEntity[]}
                template={template}
                defaultExpanded={false}
                icon={<Check sx={{ color: '#4FC318' }} />}
                title={`${tablesData.succeededEntities.length} ${i18next.t('wizard.entity.loadEntities.succeededEntities')}`}
            />
            <EntitiesTable
                rowData={(tablesData.brokenRulesEntities as IEntity[]) || []}
                template={template}
                defaultExpanded={isBrokenRulesEntities}
                icon={<Gavel style={{ color: '#FFAC2F' }} />}
                title={`${tablesData.brokenRulesEntities?.length || 0} ${i18next.t('wizard.entity.loadEntities.brokenRulesEntities')}`}
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
