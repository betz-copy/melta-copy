import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { Grid, ToggleButton, ToggleButtonGroup, IconButton, Typography, CircularProgress } from '@mui/material';
import { TableChartOutlined, AccountTreeOutlined, AddCircle } from '@mui/icons-material';
import { getEntitiesByCategoryRequest } from '../../services/entitiesService';
import { TemplateTable } from './components/TemplateTable';
import { Header } from './components/Header';
import { IMongoCategory } from '../../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

const Category: React.FC = () => {
    const queryClient = useQueryClient();
    const params = useParams();
    const { categoryId } = params;
    const [viewType, setViewType] = useState<'table' | 'graph'>('table');
    const [templateToHide, setTemplatesToHide] = useState<string[]>([]);

    const { data: entities } = useQuery(['getEntitiesByCategory', categoryId], () => getEntitiesByCategoryRequest(categoryId!));
    const templates = queryClient
        .getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')
        ?.filter((template) => template.category._id === categoryId);

    const categoryDisplayName = queryClient
        .getQueryData<IMongoCategory[]>('getCategories')
        ?.find((oneCategory) => oneCategory._id === categoryId)?.displayName;

    if (templates) {
        return (
            <Grid container>
                <Grid container justifyContent="center" marginBottom="1vh">
                    <Header
                        templateToHide={templateToHide}
                        category={categoryDisplayName || ''}
                        setTemplatesToHide={setTemplatesToHide}
                        templatesNames={templates.map((template) => template.displayName)}
                    />
                </Grid>
                <Grid container justifyContent="end" paddingRight="10%" marginBottom="3vh">
                    <Grid item paddingRight="1%">
                        <IconButton style={{ background: 'white', borderRadius: '7px' }}>
                            <AddCircle color="primary" />
                            <Typography fontSize={14} style={{ fontWeight: '500', paddingRight: '5px' }}>
                                הוספת יישות
                            </Typography>
                        </IconButton>
                    </Grid>
                    <Grid item>
                        <ToggleButtonGroup
                            style={{ backgroundColor: 'white' }}
                            size="small"
                            color="primary"
                            exclusive
                            value={viewType}
                            onChange={(_ev, newValue) => {
                                if (newValue !== null) setViewType(newValue);
                            }}
                        >
                            <ToggleButton size="small" value="table">
                                <TableChartOutlined fontSize="small" />
                            </ToggleButton>
                            <ToggleButton size="small" value="graph">
                                <AccountTreeOutlined />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                </Grid>
                <Grid container paddingLeft="5%" paddingRight="5%">
                    {viewType === 'table' ? (
                        <Grid container>
                            {templates
                                .filter((template) => !templateToHide.includes(template.displayName))
                                .map((template) => (
                                    <TemplateTable
                                        key={template._id}
                                        template={template}
                                        entities={entities?.filter((entity) => entity.templateId === template._id) || []}
                                    />
                                ))}
                        </Grid>
                    ) : (
                        <>graph</>
                    )}
                </Grid>
            </Grid>
        );
    }

    return <CircularProgress size={20} />;
};

export default Category;
