import { Add } from '@mui/icons-material';
import { Button, Divider, FormHelperText, Grid } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { SelectCheckbox } from '../../../common/SelectCheckBox';
import { StepComponentProps } from '../../../common/wizards';
import { IAGGridFilter, IFilterTemplate } from '../../../common/wizards/entityTemplate/commonInterfaces';
import { ChartForm, TableForm, ViewMode } from '../../../interfaces/dashboard';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { getRelevantEntityTemplate } from '../../Dashboard/DashboardItemDetails/Chart/BodyComponent';
import FilterCompetent from './FilterCompetent';

const FilterSideBar = <T extends TableForm | ChartForm>(
    props: StepComponentProps<T> & {
        viewMode: ViewMode;
    },
) => {
    const { values, setFieldValue, viewMode, errors } = props;
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const entityTemplate = getRelevantEntityTemplate(entityTemplates, values.templateId, values.childTemplateId);
    const entityTemplateFields = entityTemplate && Object.keys(entityTemplate.properties.properties);

    const filterInitialValues: IFilterTemplate = {
        filterProperty: '',
        filterField: {} as IAGGridFilter,
    };

    const handleAddFilter = () => {
        const updatedFilters = [...(values.filter ?? []), filterInitialValues];

        setFieldValue('filter', updatedFilters);
    };

    return (
        <Grid display="flex" sx={{ flexDirection: 'column' }} gap={3}>
            {'columns' in values && (
                <div>
                    <Grid>
                        <SelectCheckbox
                            options={entityTemplateFields!}
                            selectedOptions={values.columns}
                            setSelectedOptions={(value) => setFieldValue('columns', value)}
                            title={i18next.t('dashboard.tables.columnsToShow')}
                            getOptionId={(_id) => _id}
                            getOptionLabel={(option) => entityTemplate?.properties.properties[option]?.title || ''}
                            toTopBar={false}
                            hideSearchBar
                            isDraggableDisabled
                            isSelectDisabled={viewMode === ViewMode.ReadOnly}
                            hideChooseAll={viewMode === ViewMode.ReadOnly}
                        />
                    </Grid>
                    {/** biome-ignore lint/suspicious/noExplicitAny: error is any */}
                    {(errors as any).columns && <FormHelperText error>{(errors as any).columns}</FormHelperText>}

                    <Grid>
                        <Divider sx={{ width: '95%' }} />
                    </Grid>
                </div>
            )}
            <Grid sx={{ overflowY: 'auto', maxHeight: '76vh' }}>
                <FilterCompetent viewMode={viewMode} formik={props} />
            </Grid>
            {viewMode !== ViewMode.ReadOnly && (
                <Button sx={{ marginRight: 'auto', zIndex: '100' }} onClick={handleAddFilter} startIcon={<Add style={{ marginLeft: '5px' }} />}>
                    {i18next.t('charts.actions.filterFields')}
                </Button>
            )}
        </Grid>
    );
};

export default FilterSideBar;
