import React, { useMemo } from 'react';
import { Grid, Typography, TextField, IconButton, FormControlLabel, Button, Chip, Box as MuiBox, Autocomplete } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { IMongoPrintingTemplate } from '../../../interfaces/printingTemplates';
import { useQueryClient } from 'react-query';
import { ICategoryMap } from '../../../interfaces/categories';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { Formik, FieldArray, getIn } from 'formik';
import * as Yup from 'yup';
import { MeltaCheckbox } from '../../../common/MeltaCheckbox';
import { BlueTitle } from '../../../common/BlueTitle';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { createPrintingTemplateRequest, updatePrintingTemplateRequest } from '../../../services/templates/printingTemplateService';

interface PrintingTemplateCardProps {
    onClose: () => void;
    printingTemplate: IMongoPrintingTemplate;
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

const CreateOrEditPrintTemplate: React.FC<PrintingTemplateCardProps> = ({ onClose, printingTemplate }) => {
    const queryClient = useQueryClient();
    const categoriesMap = queryClient.getQueryData<ICategoryMap>('getCategories');
    const entityTemplatesMap = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');
    const categories = categoriesMap ? Array.from(categoriesMap.values()) : [];
    const entityTemplates = entityTemplatesMap ? Array.from(entityTemplatesMap.values()) : [];

    const hasChanges = useMemo(() => {
        const initialValues = printingTemplate;

        return (values: IMongoPrintingTemplate) => {
            const currentValues = values;

            if (initialValues.name !== currentValues.name) return true;

            if (initialValues.sections.length !== currentValues.sections.length) return true;

            for (let i = 0; i < currentValues.sections.length; i++) {
                const initialSection = initialValues.sections[i];
                const currentSection = currentValues.sections[i];

                if (!initialSection) return true;

                if (
                    initialSection.categoryId !== currentSection.categoryId ||
                    initialSection.entityTemplateId !== currentSection.entityTemplateId ||
                    JSON.stringify(initialSection.selectedColumns) !== JSON.stringify(currentSection.selectedColumns)
                ) {
                    return true;
                }
            }

            if (
                initialValues.compactView !== currentValues.compactView ||
                initialValues.addEntityCheckbox !== currentValues.addEntityCheckbox ||
                initialValues.appendSignatureField !== currentValues.appendSignatureField
            ) {
                return true;
            }

            return false;
        };
    }, [printingTemplate]);

    const getEntitiesForCategory = (categoryId: string) => entityTemplates.filter((et) => et.category._id === categoryId);
    const getColumnsForEntityTemplate = (entityTemplateId: string) => {
        const et = entityTemplates.find((et) => et._id === entityTemplateId);
        if (!et) return [];
        return Object.entries(et.properties.properties).map(([key, value]: [string, any]) => ({ id: key, name: value.title || key }));
    };

    const handleSubmit = async (values: IMongoPrintingTemplate) => {
        const isUpdate = Boolean(values._id);
        const { _id, createdAt, updatedAt, ...rest } = values;

        try {
            const savedTemplate = isUpdate ? await updatePrintingTemplateRequest(values._id, rest) : await createPrintingTemplateRequest(rest);

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
        } catch (err) {
            if (isUpdate) {
                toast.error(i18next.t('wizard.printingTemplate.failedToUpdate'));
            } else {
                toast.error(i18next.t('wizard.printingTemplate.failedToCreate'));
            }
        }
    };

    return (
        <MuiBox>
            <Formik initialValues={printingTemplate} validationSchema={validationSchema} enableReinitialize={true} onSubmit={handleSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, setFieldValue, setTouched, validateForm, isValid }) => (
                    <form>
                        <MuiBox
                            sx={{
                                position: 'relative',
                                bgcolor: 'background.paper',
                                borderRadius: 4,
                                p: 4,
                                maxHeight: '80vh',
                                overflow: 'auto',
                            }}
                        >
                            <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
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
                            <Grid container alignItems="center" justifyContent="flex-start" spacing={5} sx={{ mb: 2 }}>
                                <Grid item sx={{ flexShrink: 0, minWidth: 450 }}>
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
                                        labelPlacement="end"
                                    />
                                </Grid>
                                <Grid item>
                                    <FormControlLabel
                                        control={
                                            <MeltaCheckbox
                                                checked={values.appendSignatureField}
                                                onChange={(_, checked) => setFieldValue('appendSignatureField', checked)}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ fontWeight: 400, fontSize: 14 }}>
                                                {i18next.t('wizard.printingTemplate.appendSignatureField')}
                                            </Typography>
                                        }
                                        labelPlacement="end"
                                    />
                                </Grid>
                                <Grid item>
                                    <FormControlLabel
                                        control={
                                            <MeltaCheckbox
                                                checked={values.addEntityCheckbox}
                                                onChange={(_, checked) => setFieldValue('addEntityCheckbox', checked)}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ fontWeight: 400, fontSize: 14 }}>
                                                {i18next.t('wizard.printingTemplate.addEntityCheckbox')}
                                            </Typography>
                                        }
                                        labelPlacement="end"
                                    />
                                </Grid>
                            </Grid>
                            {touched.name && errors.name && (
                                <Grid container justifyContent="flex-start" sx={{ mb: 1 }}>
                                    <Typography color="error" textAlign="left">
                                        {errors.name}
                                    </Typography>
                                </Grid>
                            )}
                            <Grid container justifyContent="flex-start" sx={{ mb: 2 }}>
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
                                                    key={idx}
                                                    container
                                                    alignItems="center"
                                                    spacing={2}
                                                    sx={{
                                                        p: 2,
                                                        flexWrap: 'nowrap',
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <Grid item sx={{ width: 250, flexShrink: 0, minWidth: 250 }}>
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
                                                    <Grid item sx={{ width: 250, flexShrink: 0, minWidth: 250 }}>
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
                                                    <Grid item sx={{ width: 570, flexShrink: 0, minWidth: 570 }}>
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
                                                    <Grid item sx={{ flexShrink: 0, minWidth: 'auto' }}>
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
                                                    {errors.sections}
                                                </Typography>
                                            </Grid>
                                        )}
                                    </>
                                )}
                            </FieldArray>
                            <Grid container justifyContent="center" sx={{ mt: 4 }}>
                                <Button
                                    type="submit"
                                    sx={{ marginBottom: '10px' }}
                                    variant="contained"
                                    color="primary"
                                    disabled={!hasChanges(values)}
                                    onClick={async () => {
                                        setTouched(
                                            {
                                                name: true,
                                                sections: values.sections.map(() => ({
                                                    categoryId: true,
                                                    entityTemplateId: true,
                                                    selectedColumns: true,
                                                })),
                                            },
                                            true,
                                        );
                                        const isValid = await validateForm().then((errors) => Object.keys(errors).length === 0);
                                        if (isValid) {
                                            await handleSubmit({ ...values, _id: printingTemplate._id });
                                        }
                                    }}
                                >
                                    {i18next.t('wizard.finish')}
                                </Button>
                            </Grid>
                        </MuiBox>
                    </form>
                )}
            </Formik>
        </MuiBox>
    );
};

export default CreateOrEditPrintTemplate;
