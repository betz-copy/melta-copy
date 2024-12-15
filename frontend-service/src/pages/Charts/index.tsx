import { Grid } from '@mui/material';
import React from 'react';
import { useQueryClient } from 'react-query';
import { useParams } from 'wouter';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { ChartHeader } from './ChartHeader';

interface IChartsPageProps {
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const ChartsPage: React.FC<IChartsPageProps> = () => {
    const { templateId } = useParams();

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const template = entityTemplates.get(templateId as string) as IMongoEntityTemplatePopulated;

    return (
        <Grid>
            <ChartHeader template={template} />
        </Grid>
    );
};

export default ChartsPage;
