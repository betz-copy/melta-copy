import DeleteIcon from '@mui/icons-material/Delete';
import { Autocomplete, Chip, Grid, IconButton, TextField } from '@mui/material';
import { IPropertyValue } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IPrintSection } from '@packages/printing-template';
import { getIn } from 'formik';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { ICategoryMap } from '../../../../interfaces/template';

type IPrintSectionRowProps = {
    section: IPrintSection;
    entities: IMongoEntityTemplateWithConstraintsPopulated[];
    columns: {
        id: string;
        name: string;
    }[];
    idx: number;
    setFieldValue: (field: string, value: IPropertyValue) => void;
    remove: (index: number) => void;
    sectionTouched: Record<string, boolean>;
    sectionError: Record<string, string>;
};

const PrintSectionRow: React.FC<IPrintSectionRowProps> = ({
    section,
    entities,
    columns,
    idx,
    setFieldValue,
    remove,
    sectionTouched,
    sectionError,
}) => {
    const queryClient = useQueryClient();
    const categoriesMap = queryClient.getQueryData<ICategoryMap>('getCategories');
    const categories = categoriesMap ? Array.from(categoriesMap.values()) : [];

    const fieldErrorProps = (name: string) => ({
        error: Boolean(getIn(sectionTouched, name) && getIn(sectionError, name)),
        helperText: getIn(sectionTouched, name) && getIn(sectionError, name) ? getIn(sectionError, name) : undefined,
    });

    return (
        <Grid container alignItems="center" spacing={2}>
            <Grid size={{ xs: 2 }}>
                <Autocomplete
                    options={categories}
                    getOptionLabel={(option) => option.displayName}
                    value={categories.find((cat) => cat._id === section.categoryId) || null}
                    onChange={(_, value) => {
                        setFieldValue(`sections[${idx}].categoryId`, value?._id || '');
                        setFieldValue(`sections[${idx}].entityTemplateId`, '');
                        setFieldValue(`sections[${idx}].selectedColumns`, []);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            {...fieldErrorProps('categoryId')}
                            label={i18next.t('wizard.printingTemplate.category')}
                            size="small"
                            variant="outlined"
                            fullWidth
                        />
                    )}
                    fullWidth
                    disableClearable={false}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                />
            </Grid>

            <Grid size={{ xs: 2 }}>
                <Autocomplete
                    options={entities}
                    getOptionLabel={(option) => option.displayName}
                    value={entities.find((ent) => ent._id === section.entityTemplateId) || null}
                    onChange={(_, value) => {
                        setFieldValue(`sections[${idx}].entityTemplateId`, value?._id || '');
                        setFieldValue(`sections[${idx}].selectedColumns`, []);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            {...fieldErrorProps('entityTemplateId')}
                            label={i18next.t('wizard.printingTemplate.entityTemplate')}
                            size="small"
                            variant="outlined"
                            fullWidth
                        />
                    )}
                    fullWidth
                    disableClearable={false}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    disabled={!section.categoryId}
                />
            </Grid>

            <Grid size={{ xs: 7 }}>
                <Autocomplete
                    options={columns}
                    getOptionLabel={(option) => option.name}
                    value={columns.filter((col) => section.selectedColumns.includes(col.id))}
                    onChange={(_, value) => {
                        setFieldValue(
                            `sections[${idx}].selectedColumns`,
                            value.map((col) => col.id),
                        );
                    }}
                    multiple
                    disableCloseOnSelect
                    getOptionDisabled={(option) => section.selectedColumns.length >= 8 && !section.selectedColumns.includes(option.id)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            {...fieldErrorProps('selectedColumns')}
                            label={i18next.t('wizard.printingTemplate.columns')}
                            size="small"
                            variant="outlined"
                            fullWidth
                        />
                    )}
                    renderTags={(value) =>
                        value.map((option) => (
                            <Chip
                                key={option.id}
                                label={option.name}
                                sx={{
                                    backgroundColor: '#EBEFFA',
                                    color: '#53566E',
                                    height: '24px',
                                    m: 0.2,
                                }}
                            />
                        ))
                    }
                    fullWidth
                    disableClearable={false}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    disabled={!section.entityTemplateId}
                />
            </Grid>

            <Grid sx={{ flexShrink: 0, minWidth: 'auto' }}>
                <IconButton onClick={() => remove(idx)} size="small">
                    <DeleteIcon />
                </IconButton>
            </Grid>
        </Grid>
    );
};

export default PrintSectionRow;
