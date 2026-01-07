import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { Autocomplete, Button, Chip, DialogContent, DialogTitle, FormControlLabel, Grid, IconButton, TextField, Typography } from '@mui/material';
import { FieldArray, Form, Formik, getIn } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { ICategoryMap } from '../../../interfaces/categories';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { IMongoPrintingTemplate, IPrintingTemplateMap } from '../../../interfaces/printingTemplates';
import { createPrintingTemplateRequest, updatePrintingTemplateRequest } from '../../../services/templates/printingTemplateService';
import BlueTitle from '../../MeltaDesigns/BlueTitle';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';

interface PrintingTemplateCardProps {
    onClose: () => void;
    printingTemplate: IMongoPrintingTemplate;
    isEditMode: boolean;
}

const sectionSchema = Yup.object().shape({
    categoryId: Yup.string().required(i18next.t('wizard.printingTemplate.mustSelectCategory')),
    entityTemplateId: Yup.string().required(i18next.t('wizard.printingTemplate.mustSelectEntityTemplate')),
    selectedColumns: Yup.array()
        .of(Yup.string())
        .min(1, i18next.t('wizard.printingTemplate.minColumns'))
        .max(8, i18next.t('wizard.printingTemplate.maxColumns')),
});

const validationSchema = Yup.object().shape({
    name: Yup.string().required(i18next.t('wizard.printingTemplate.requiredField')),
    sections: Yup.array().of(sectionSchema).min(1, i18next.t('wizard.printingTemplate.mustAddAtLeastOneTemplateToPrint')),
});

const CreateOrEditPrintTemplate: React.FC<PrintingTemplateCardProps> = ({ onClose, printingTemplate, isEditMode }) => {
    const queryClient = useQueryClient();
    const categoriesMap = queryClient.getQueryData<ICategoryMap>('getCategories');
    const entityTemplatesMap = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');
    const categories = categoriesMap ? Array.from(categoriesMap.values()) : [];
    const entityTemplates = entityTemplatesMap ? Array.from(entityTemplatesMap.values()) : [];

    const mutation = useMutation({
        mutationFn: async (data: IMongoPrintingTemplate) => {
            const { _id, createdAt: _c, updatedAt: _u, ...rest } = data;
            return isEditMode ? await updatePrintingTemplateRequest(_id, rest) : await createPrintingTemplateRequest(rest);
        },
        onSuccess: (savedTemplate) => {
            queryClient.setQueryData<IPrintingTemplateMap>('getPrintingTemplates', (printingTemplateMap) => {
                printingTemplateMap!.set(savedTemplate._id, savedTemplate);
                return printingTemplateMap!;
            });
            toast.success(i18next.t(`wizard.printingTemplate.${isEditMode ? 'updated' : 'created'}Successfully`));
            onClose();
        },
        onError: () => {
            toast.error(i18next.t(`wizard.printingTemplate.failedTo${isEditMode ? 'Update' : 'Create'}`));
        },
    });

    const getEntitiesForCategory = (categoryId: string) => entityTemplates.filter((et) => et.category._id === categoryId);

    const getColumnsForEntityTemplate = (entityTemplateId: string) => {
        const entityTemplate = entityTemplates.find((entityTemplate) => entityTemplate._id === entityTemplateId);
        if (!entityTemplate) return [];
        return Object.entries(entityTemplate.properties.properties).map(([key, value]) => ({ id: key, name: value.title || key }));
    };

    return (
        <Formik initialValues={printingTemplate} validationSchema={validationSchema} enableReinitialize={true} onSubmit={mutation.mutateAsync}>
            {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, dirty }) => (
                <Form>
                    <DialogTitle>
                        <BlueTitle
                            title={`${i18next.t(`wizard.printingTemplate.${printingTemplate._id ? 'update' : 'create'}Title`)}${printingTemplate._id ? ` - ${printingTemplate.name}` : ''}`}
                            component="h6"
                            variant="h6"
                        />

                        <IconButton
                            aria-label="close"
                            sx={{
                                position: 'absolute',
                                right: 12,
                                top: 12,
                                color: (theme) => theme.palette.grey[500],
                            }}
                            onClick={onClose}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent>
                        <Grid sx={{ mt: 2 }} container alignContent="center" alignItems="center" justifyContent="flex-start" spacing={5}>
                            <TextField
                                name="name"
                                value={values.name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                size="small"
                                variant="outlined"
                                fullWidth
                                placeholder={i18next.t('wizard.printingTemplate.templateName')}
                                label={i18next.t('wizard.printingTemplate.templateName')}
                                error={Boolean(touched.name && errors.name)}
                                helperText={errors.name}
                                sx={{ width: '350px' }}
                                slotProps={{ htmlInput: { style: { textAlign: 'right', fontWeight: 400, fontSize: 14 } } }}
                            />
                            {['compactView', 'appendSignatureField', 'addEntityCheckbox'].map((key) => (
                                <FormControlLabel
                                    control={
                                        <MeltaCheckbox
                                            checked={key === 'compactView' ? true : values[key]}
                                            onChange={(_, checked) => (key === 'compactView' ? undefined : setFieldValue('key', checked))}
                                            disabled={key === 'compactView'}
                                        />
                                    }
                                    label={
                                        <Typography sx={{ fontWeight: 400, fontSize: 14 }}>{i18next.t(`wizard.printingTemplate.${key}`)}</Typography>
                                    }
                                    labelPlacement="end"
                                    key={key}
                                />
                            ))}
                        </Grid>

                        <Grid container justifyContent="flex-start" sx={{ my: 2 }}>
                            <Typography color="#9398C2" textAlign="left" fontSize={13}>
                                {i18next.t('wizard.printingTemplate.note')}
                            </Typography>
                        </Grid>

                        <FieldArray name="sections">
                            {({ push, remove }) => (
                                <>
                                    {values.sections.map((section, idx) => {
                                        const entities = getEntitiesForCategory(section.categoryId);
                                        const columns = getColumnsForEntityTemplate(section.entityTemplateId);
                                        const sectionError = getIn(errors, `sections[${idx}]`) || {};
                                        const sectionTouched = getIn(touched, `sections[${idx}]`) || {};
                                        return (
                                            <Grid
                                                key={`${section.entityTemplateId}-${section.selectedColumns.join(',')}`}
                                                container
                                                alignItems="center"
                                                spacing={2}
                                            >
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
                                                                label={i18next.t('wizard.printingTemplate.category')}
                                                                error={Boolean(sectionTouched.categoryId && sectionError.categoryId)}
                                                                helperText={
                                                                    sectionTouched.categoryId && sectionError.categoryId
                                                                        ? sectionError.categoryId
                                                                        : undefined
                                                                }
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
                                                                label={i18next.t('wizard.printingTemplate.entityTemplate')}
                                                                error={Boolean(sectionTouched.entityTemplateId && sectionError.entityTemplateId)}
                                                                helperText={
                                                                    sectionTouched.entityTemplateId && sectionError.entityTemplateId
                                                                        ? sectionError.entityTemplateId
                                                                        : undefined
                                                                }
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
                                                        getOptionDisabled={(option) =>
                                                            section.selectedColumns.length >= 8 && !section.selectedColumns.includes(option.id)
                                                        }
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                label={i18next.t('wizard.printingTemplate.columns')}
                                                                error={Boolean(sectionTouched.selectedColumns && sectionError.selectedColumns)}
                                                                helperText={
                                                                    sectionTouched.selectedColumns && sectionError.selectedColumns
                                                                        ? sectionError.selectedColumns
                                                                        : undefined
                                                                }
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
                                    })}
                                    <Grid container justifyContent="flex-start" sx={{ mt: 2 }}>
                                        <Button
                                            type="button"
                                            variant="text"
                                            style={{ alignSelf: 'start' }}
                                            onClick={() => push({ categoryId: '', entityTemplateId: '', selectedColumns: [] })}
                                        >
                                            <Typography style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                                <AddIcon /> {i18next.t('wizard.printingTemplate.addPrintTemplate')}
                                            </Typography>
                                        </Button>
                                    </Grid>

                                    {touched.sections && errors.sections && values.sections.length === 0 && (
                                        <Grid container justifyContent="flex-start" sx={{ mt: 1 }}>
                                            <Typography color="error" variant="body2">
                                                {String(errors.sections)}
                                            </Typography>
                                        </Grid>
                                    )}
                                </>
                            )}
                        </FieldArray>

                        <Grid container justifyContent="center" sx={{ mt: 4 }}>
                            <Button type="submit" sx={{ marginBottom: '10px' }} variant="contained" color="primary" disabled={!dirty || isSubmitting}>
                                {i18next.t('wizard.finish')}
                            </Button>
                        </Grid>
                    </DialogContent>
                </Form>
            )}
        </Formik>
    );
};

export default CreateOrEditPrintTemplate;
