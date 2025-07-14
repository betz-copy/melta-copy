import React from 'react';
import { Grid, Typography, TextField, IconButton, FormControlLabel, Button, Chip, Box as MuiBox, Autocomplete } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { IMongoPrintingTemplate } from '../../../interfaces/printingTemplates';
import { useQueryClient } from 'react-query';
import { ICategoryMap } from '../../../interfaces/categories';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { useFormik, FormikProvider, FieldArray, getIn } from 'formik';
import * as Yup from 'yup';
import { MeltaCheckbox } from '../../../common/MeltaCheckbox';
import { BlueTitle } from '../../../common/BlueTitle';
import i18next from 'i18next';
import axios from '../../../axios';
import { toast } from 'react-toastify';

interface PrintingTemplateCardProps {
    onClose: () => void;
    printingTemplate: IMongoPrintingTemplate;
    onAfterSave?: () => void;
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
    sections: Yup.array().of(sectionSchema).min(1, i18next.t('wizard.printingTemplate.requiredField')),
});

const getInitialValues = (printingTemplate: IMongoPrintingTemplate) => {
    return {
        ...printingTemplate,
        name: printingTemplate.name || '',
        sections:
            printingTemplate.sections && printingTemplate.sections.length > 0
                ? printingTemplate.sections
                : [
                      {
                          categoryId: '',
                          entityTemplateId: '',
                          selectedColumns: [],
                      },
                  ],
        compactView: printingTemplate.compactView ?? false,
        addEntityCheckbox: printingTemplate.addEntityCheckbox ?? false,
        appendSignatureField: printingTemplate.appendSignatureField ?? false,
    };
};

const CreateOrEditPrintTemplate: React.FC<PrintingTemplateCardProps> = ({ onClose, printingTemplate, onAfterSave }) => {
    const queryClient = useQueryClient();
    const categoriesMap = queryClient.getQueryData<ICategoryMap>('getCategories');
    const entityTemplatesMap = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');
    const categories = categoriesMap ? Array.from(categoriesMap.values()) : [];
    const entityTemplates = entityTemplatesMap ? Array.from(entityTemplatesMap.values()) : [];

    const formik = useFormik({
        initialValues: getInitialValues(printingTemplate),
        validationSchema,
        enableReinitialize: true,
        onSubmit: (values) => {
            onClose();
        },
    });

    const getEntitiesForCategory = (categoryId: string) => entityTemplates.filter((et) => et.category._id === categoryId);
    const getColumnsForEntityTemplate = (entityTemplateId: string) => {
        const et = entityTemplates.find((et) => et._id === entityTemplateId);
        if (!et) return [];
        return Object.entries(et.properties.properties).map(([key, value]: [string, any]) => ({ id: key, name: value.title || key }));
    };

    const handleSave = async (values: IMongoPrintingTemplate) => {
        try {
            let response;
            const apiRoute = '/templates/printing-templates';
            const isUpdate = Boolean(values._id);

            if (isUpdate) {
                const { _id, createdAt, updatedAt, ...rest } = values;
                response = await axios.put(`${apiRoute}/${values._id}`, rest);
            } else {
                const { _id, createdAt, updatedAt, ...rest } = values;
                response = await axios.post(apiRoute, rest);
            }
            const savedTemplate = response.data;
            queryClient.setQueryData<IMongoPrintingTemplate[]>('getPrintingTemplates', (old = []) => {
                const idx = old.findIndex((t) => t._id === savedTemplate._id);
                if (idx !== -1) {
                    const updated = [...old];
                    updated[idx] = savedTemplate;
                    return updated;
                }
                return [...old, savedTemplate];
            });

            if (isUpdate) {
                toast.success(i18next.t('wizard.printingTemplate.updatedSuccessfully'));
            } else {
                toast.success(i18next.t('wizard.printingTemplate.createdSuccessfully'));
            }

            onClose();
            if (onAfterSave) onAfterSave();
        } catch (err) {
            const isUpdate = Boolean(values._id);
            if (isUpdate) {
                toast.error(i18next.t('wizard.printingTemplate.failedToUpdate'));
            } else {
                toast.error(i18next.t('wizard.printingTemplate.failedToCreate'));
            }
        }
    };

    return (
        <MuiBox sx={{ direction: 'rtl' }}>
            <FormikProvider value={formik}>
                <form onSubmit={formik.handleSubmit}>
                    <MuiBox
                        sx={{
                            position: 'relative',
                            height: '85vh',
                            bgcolor: 'background.paper',
                            borderRadius: 4,
                            p: 4,
                        }}
                    >
                        <Grid container alignItems="center" justifyContent="space-between" direction="row-reverse" sx={{ mb: 3 }}>
                            <Grid item>
                                <BlueTitle
                                    title={
                                        printingTemplate._id
                                            ? `${i18next.t('wizard.printingTemplate.updateTitle')} - ${printingTemplate.name}`
                                            : i18next.t('wizard.printingTemplate.createTitle')
                                    }
                                    component="h6"
                                    variant="h6"
                                />
                            </Grid>
                            <Grid item>
                                <IconButton aria-label="close" onClick={onClose}>
                                    <CloseIcon />
                                </IconButton>
                            </Grid>
                        </Grid>
                        <Grid container alignItems="center" justifyContent="flex-end" spacing={2} direction="row-reverse" sx={{ mb: 2 }}>
                            <Grid item sx={{ minWidth: 300, flex: 1 }}>
                                <TextField
                                    name="name"
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    size="small"
                                    variant="outlined"
                                    fullWidth
                                    placeholder={i18next.t('wizard.printingTemplate.templateName')}
                                    label={i18next.t('wizard.printingTemplate.templateName')}
                                    error={Boolean(formik.touched.name && formik.errors.name)}
                                    inputProps={{ style: { textAlign: 'right', fontWeight: 400, fontSize: 14 } }}
                                />
                            </Grid>
                            <Grid item>
                                <FormControlLabel
                                    control={<MeltaCheckbox checked={true} disabled={true} />}
                                    label={
                                        <Typography sx={{ fontWeight: 400, fontSize: 14 }}>
                                            {i18next.t('wizard.printingTemplate.compactView')}
                                        </Typography>
                                    }
                                    labelPlacement="start"
                                    sx={{ mr: 0 }}
                                />
                            </Grid>
                            <Grid item>
                                <FormControlLabel
                                    control={
                                        <MeltaCheckbox
                                            checked={formik.values.appendSignatureField}
                                            onChange={(_, checked) => formik.setFieldValue('appendSignatureField', checked)}
                                        />
                                    }
                                    label={
                                        <Typography sx={{ fontWeight: 400, fontSize: 14 }}>
                                            {i18next.t('wizard.printingTemplate.appendSignatureField')}
                                        </Typography>
                                    }
                                    labelPlacement="start"
                                    sx={{ mr: 0 }}
                                />
                            </Grid>
                            <Grid item>
                                <FormControlLabel
                                    control={
                                        <MeltaCheckbox
                                            checked={formik.values.addEntityCheckbox}
                                            onChange={(_, checked) => formik.setFieldValue('addEntityCheckbox', checked)}
                                        />
                                    }
                                    label={
                                        <Typography sx={{ fontWeight: 400, fontSize: 14 }}>
                                            {i18next.t('wizard.printingTemplate.addEntityCheckbox')}
                                        </Typography>
                                    }
                                    labelPlacement="start"
                                    sx={{ ml: 0 }}
                                />
                            </Grid>
                        </Grid>
                        {formik.touched.name && formik.errors.name && (
                            <Grid container justifyContent="flex-end" sx={{ mb: 1 }}>
                                <Typography color="error" textAlign="right">
                                    {formik.errors.name}
                                </Typography>
                            </Grid>
                        )}
                        <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
                            <Typography color="#9398C2" textAlign="right">
                                {i18next.t('wizard.printingTemplate.note')}
                            </Typography>
                        </Grid>
                        <FieldArray name="sections">
                            {({ push, remove }) => (
                                <>
                                    {formik.values.sections.map((section, idx) => {
                                        const entities = getEntitiesForCategory(section.categoryId);
                                        const columns = getColumnsForEntityTemplate(section.entityTemplateId);
                                        const sectionError = getIn(formik.errors, `sections[${idx}]`) || {};
                                        const sectionTouched = getIn(formik.touched, `sections[${idx}]`) || {};
                                        return (
                                            <Grid key={idx} container alignItems="center" spacing={2} sx={{ p: 2 }} direction="row-reverse">
                                                <Grid item sx={{ width: 250 }}>
                                                    <Autocomplete
                                                        options={categories}
                                                        getOptionLabel={(option) => option.displayName}
                                                        value={categories.find((cat) => cat._id === section.categoryId) || null}
                                                        onChange={(_, value) => {
                                                            formik.setFieldValue(`sections[${idx}].categoryId`, value?._id || '');
                                                            formik.setFieldValue(`sections[${idx}].entityTemplateId`, '');
                                                            formik.setFieldValue(`sections[${idx}].selectedColumns`, []);
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
                                                                dir="rtl"
                                                            />
                                                        )}
                                                        fullWidth
                                                        disableClearable={false}
                                                        isOptionEqualToValue={(option, value) => option._id === value._id}
                                                    />
                                                </Grid>
                                                <Grid item sx={{ width: 250 }}>
                                                    <Autocomplete
                                                        options={entities}
                                                        getOptionLabel={(option) => option.displayName}
                                                        value={entities.find((ent) => ent._id === section.entityTemplateId) || null}
                                                        onChange={(_, value) => {
                                                            formik.setFieldValue(`sections[${idx}].entityTemplateId`, value?._id || '');
                                                            formik.setFieldValue(`sections[${idx}].selectedColumns`, []);
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
                                                                dir="rtl"
                                                            />
                                                        )}
                                                        fullWidth
                                                        disableClearable={false}
                                                        isOptionEqualToValue={(option, value) => option._id === value._id}
                                                        disabled={!section.categoryId}
                                                    />
                                                </Grid>
                                                <Grid item sx={{ width: 570 }}>
                                                    <Autocomplete
                                                        options={columns}
                                                        getOptionLabel={(option) => option.name}
                                                        value={columns.filter((col) => section.selectedColumns.includes(col.id))}
                                                        onChange={(_, value) => {
                                                            formik.setFieldValue(
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
                                                                dir="rtl"
                                                            />
                                                        )}
                                                        renderTags={(value) =>
                                                            value.map((option) => (
                                                                <Chip
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
                                                <Grid item>
                                                    <IconButton onClick={() => remove(idx)} size="small">
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Grid>
                                            </Grid>
                                        );
                                    })}
                                    <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
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
                                </>
                            )}
                        </FieldArray>
                        <Grid container justifyContent="center" sx={{ mt: 4 }}>
                            <Button
                                type="button"
                                variant="contained"
                                color="primary"
                                onClick={async () => {
                                    formik.setTouched(
                                        {
                                            name: true,
                                            sections: formik.values.sections.map(() => ({
                                                categoryId: true,
                                                entityTemplateId: true,
                                                selectedColumns: true,
                                            })),
                                        },
                                        true,
                                    );
                                    const isValid = await formik.validateForm().then((errors) => Object.keys(errors).length === 0);
                                    if (isValid) {
                                        handleSave({ ...formik.values, _id: printingTemplate._id });
                                    }
                                }}
                            >
                                {i18next.t('wizard.finish')}
                            </Button>
                        </Grid>
                    </MuiBox>
                </form>
            </FormikProvider>
        </MuiBox>
    );
};

export default CreateOrEditPrintTemplate;
