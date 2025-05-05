import React, { CSSProperties, useMemo, useRef, useState } from 'react';
import { Autocomplete, Box, Button, Card, Grid, Tab, TextField, useTheme } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import i18next from 'i18next';
import { FilterList, Settings } from '@mui/icons-material';
import { useQueryClient } from 'react-query';
import { FilterSideBar } from '../../Charts/ChartPage/filterSideBar';
import { IEntity, IGraphFilterBodyBatch } from '../../../interfaces/entities';
import { TopBarGrid } from '../../../common/TopBar';
import { BlueTitle } from '../../../common/BlueTitle';
import { useWorkspaceStore } from '../../../stores/workspace';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../../../common/EntitiesTableOfTemplate';
import { filterModelToFilterOfGraph } from '../../Graph/GraphFilterToBackend';

const Table: React.FC = () => {
    const sideBarTabs = [
        { name: 'generalDetails', labelKey: 'generalDetails', icon: <Settings fontSize="small" /> },
        { name: 'filterDetails', labelKey: 'filterDetails', icon: <FilterList fontSize="small" /> },
    ];

    const [filterRecord, setFilterRecord] = useState<IGraphFilterBodyBatch>({});
    const [filters, setFilters] = useState<number[]>([]);

    const [tabValue, setTabValue] = useState('generalDetails');
    const theme = useTheme();

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    const selectedTemplate = useMemo(
        () => (selectedTemplateId ? entityTemplates.get(selectedTemplateId) : undefined),
        [entityTemplates, selectedTemplateId],
    );

    const bgColor: CSSProperties['backgroundColor'] = theme.palette.mode === 'dark' ? '#131313' : '#fcfeff';

    const workspace = useWorkspaceStore((state) => state.workspace);

    const { defaultRowHeight, defaultFontSize } = workspace.metadata.agGrid;

    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntity>>(null);

    const memoizedFilter = useMemo(
        () =>
            filterRecord && selectedTemplateId && Object.keys(filterRecord).length > 0
                ? filterModelToFilterOfGraph(filterRecord)[selectedTemplateId].filter
                : undefined,
        [filterRecord, selectedTemplateId],
    );

    const setColumnsVisible = (colId: string) => entitiesTableRef.current?.setColumnsVisible(colId);

    const moveColumn = (colId: string, destination: number) => entitiesTableRef.current?.moveColumn(colId, destination);

    return (
        <Box>
            <TopBarGrid
                container
                alignItems="center"
                wrap="nowrap"
                sx={{ marginBottom: 0, paddingRight: '1.6rem', boxShadow: '  -2px 2px 6px 0px #1E277533' }}
            >
                <Grid>
                    <BlueTitle
                        title="הוספת טבלה"
                        component="h4"
                        variant="h4"
                        style={{ fontSize: workspace.metadata.mainFontSizes.headlineTitleFontSize, whiteSpace: 'nowrap' }}
                    />
                </Grid>
            </TopBarGrid>
            <Grid container flexWrap="nowrap" height="94.7vh" width="100%" justifyContent="space-evenly">
                <Grid item container justifyContent="space-evenly" flexWrap="nowrap" height="100%">
                    <Grid item container width="100%" height="70%" alignItems="center" justifyContent="center" paddingTop="20px">
                        {selectedTemplate && (
                            <Card sx={{ width: '98%', height: 'fit-content', borderRadius: '7px', border: '1px #CCCFE5', gap: 2 }}>
                                <BlueTitle
                                    title="הוספת טבלה"
                                    component="h4"
                                    variant="h4"
                                    style={{ fontSize: workspace.metadata.mainFontSizes.headlineTitleFontSize, justifySelf: 'center' }}
                                />
                                <EntitiesTableOfTemplate
                                    ref={entitiesTableRef}
                                    template={selectedTemplate}
                                    getRowId={(currentEntity) => currentEntity.properties._id}
                                    getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                                    rowHeight={defaultRowHeight}
                                    fontSize={`${defaultFontSize}px`}
                                    rowModelType="infinite"
                                    saveStorageProps={{
                                        shouldSaveFilter: false,
                                        shouldSaveWidth: false,
                                        shouldSaveVisibleColumns: false,
                                        shouldSaveSorting: false,
                                        shouldSaveColumnOrder: false,
                                        shouldSavePagination: false,
                                        shouldSaveScrollPosition: false,
                                    }}
                                    showNavigateToRowButton={false}
                                    editable={false}
                                    defaultFilter={memoizedFilter}
                                    disableFilter
                                />
                            </Card>
                        )}
                    </Grid>
                </Grid>
                <TabContext value={tabValue}>
                    <Grid
                        item
                        sx={{
                            width: 375,
                            backgroundColor: bgColor,
                            boxShadow: '2px 2px 10.15px 0px #1E277533',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Grid item sx={{ marginTop: '5px', justifyContent: 'space-between', width: '92%' }}>
                            <TabList
                                onChange={async (_event, newValue) => {
                                    setTabValue(newValue);
                                }}
                                variant="standard"
                                sx={{
                                    borderBottom: '1px solid #E0E0E0',
                                }}
                            >
                                {sideBarTabs.map(({ name, icon, labelKey }) => (
                                    <Tab
                                        key={name}
                                        iconPosition="start"
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                                {i18next.t(`charts.${labelKey}`)}
                                            </Box>
                                        }
                                        icon={icon}
                                        value={name}
                                        wrapped
                                        sx={{
                                            minHeight: '44px',
                                            fontWeight: tabValue === name ? '600' : '400',
                                            fontSize: '14px',
                                            fontFamily: 'Rubik',
                                            width: '50%',
                                            '&:focus': {
                                                fontWeight: '700',
                                            },
                                        }}
                                    />
                                ))}
                            </TabList>
                        </Grid>
                        <Grid item sx={{ width: '100%', padding: '20px' }}>
                            {sideBarTabs.map(({ name }) => (
                                <TabPanel key={name} value={name} sx={{ padding: 0 }}>
                                    {name === 'generalDetails' ? (
                                        <Grid item>
                                            <Autocomplete
                                                value={selectedTemplate?._id || null}
                                                onChange={(_e, newValue) => setSelectedTemplateId(newValue)}
                                                options={Array.from(entityTemplates.keys())}
                                                getOptionLabel={(id) => entityTemplates.get(id)?.displayName || id}
                                                renderInput={(params) => <TextField {...params} label={i18next.t('entity')} fullWidth />}
                                            />
                                        </Grid>
                                    ) : (
                                        <FilterSideBar
                                            templateId="681739729a62eccb5e58e722"
                                            filterRecord={filterRecord}
                                            setFilterRecord={setFilterRecord}
                                            filters={filters}
                                            setFilters={setFilters}
                                            readonly={false}
                                            moveColumn={moveColumn}
                                            setColumnsVisible={setColumnsVisible}
                                        />
                                    )}
                                </TabPanel>
                            ))}
                        </Grid>
                    </Grid>
                </TabContext>
            </Grid>
        </Box>
    );
};

export default Table;
