import React, { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Grid, ToggleButton, ToggleButtonGroup, IconButton, Typography } from '@mui/material';
import { TableChartOutlined, AccountTreeOutlined, AddCircle } from '@mui/icons-material';
import { useQueryClient } from 'react-query';
import { TemplateTable } from './components/TemplateTable';
import { SideBar } from './components/SideBar';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IEntity } from '../../interfaces/entities';

const Category: React.FC = () => {
    const [searchParams] = useSearchParams();
    const categoryId = searchParams.get('categoryId');
    const queryClient = useQueryClient();
    const [templateToDisplay, setTemplatesToDisplay] = useState(['']);
    const [viewType, setViewType] = useState<'table' | 'graph'>('table');

    const templates = queryClient
        .getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!
        .filter((template) => template.category._id === categoryId);

    if (!categoryId) {
        return <Navigate to="/" />;
    }

    const entitiesByTemplate: { [id: string]: IMongoEntityTemplatePopulated & { entities: IEntity[] } } = {};
    templates.forEach((template) => {
        // eslint-disable-next-line no-param-reassign
        entitiesByTemplate[template._id] = {
            ...template,
            entities: [],
        };
    });

    return (
        <Grid container>
            <Grid item xs={12}>
                <SideBar
                    templateToDisplay={templateToDisplay}
                    categoryId={categoryId}
                    setTemplatesToDisplay={setTemplatesToDisplay}
                    templatesNames={templates.map((template) => template.displayName)}
                />
            </Grid>
            <Grid item xs={12} style={{ height: '1vh' }} />
            <Grid container alignItems="flex-end" style={{ height: '2vh' }}>
                <Grid item xs={10} />
                <Grid item xs={1}>
                    <IconButton style={{ background: 'white', borderRadius: '7px' }}>
                        <AddCircle color="primary" />
                        <Typography fontSize={14} style={{ fontWeight: '500', paddingRight: '5px' }}>
                            הוספת יישות
                        </Typography>
                    </IconButton>
                </Grid>

                <Grid item xs={0.5}>
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
            <Grid item xs={12} style={{ height: '3vh' }} />

            <Grid item xs={11}>
                {viewType === 'table' ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {Object.values(entitiesByTemplate).map((template) => (
                            <Grid key={template._id} container>
                                <Grid item xs={1.5} />
                                <Grid item xs={10}>
                                    <TemplateTable key={template._id} template={template} templateToDisplay={templateToDisplay} />
                                </Grid>
                            </Grid>
                        ))}
                    </div>
                ) : (
                    <>graph</>
                )}
            </Grid>
        </Grid>
    );
};

export { Category };
