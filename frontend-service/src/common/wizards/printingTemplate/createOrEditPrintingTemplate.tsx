import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { Autocomplete, Button, Chip, FormControlLabel, Grid, IconButton, Box as MuiBox, TextField, Typography } from '@mui/material';
import { FieldArray, Formik, getIn } from 'formik';
import i18next from 'i18next';
import React, { useMemo } from 'react';
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

    const createMutation = useMutation({
        mutationFn: createPrintingTemplateRequest,
        onSuccess: (savedTemplate) => {
            queryClient.setQueryData<IPrintingTemplateMap>('getPrintingTemplates', (printingTemplateMap) => {
                printingTemplateMap!.set(savedTemplate._id, savedTemplate);
                return printingTemplateMap!;
            });
            toast.success(i18next.t('wizard.printingTemplate.createdSuccessfully'));
            onClose();
        },
        onError: () => {
            toast.error(i18next.t('wizard.printingTemplate.failedToCreate'));
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updatePrintingTemplateRequest(id, data),
        onSuccess: (savedTemplate) => {
            queryClient.setQueryData<IPrintingTemplateMap>('getPrintingTemplates', (printingTemplateMap) => {
                printingTemplateMap!.set(savedTemplate._id, savedTemplate);
                return printingTemplateMap!;
            });
            toast.success(i18next.t('wizard.printingTemplate.updatedSuccessfully'));
            onClose();
        },
        onError: () => {
            toast.error(i18next.t('wizard.printingTemplate.failedToUpdate'));
        },
    });

    const hasChanges = useMemo(() => {
        const initialValues = printingTemplate;
        return (values: IMongoPrintingTemplate) => {
            if (initialValues.name !== values.name) return true;
            if (initialValues.sections.length !== values.sections.length) return true;

            for (let i = 0; i < values.sections.length; i++) {
                const initialSection = initialValues.sections[i];
                const currentSection = values.sections[i];
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
                initialValues.compactView !== values.compactView ||
                initialValues.addEntityCheckbox !== values.addEntityCheckbox ||
                initialValues.appendSignatureField !== values.appendSignatureField
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

    const handleSubmit = async (values: IMongoPrintingTemplate, { setTouched }: any) => {
        const isUpdate = Boolean(values._id);
        const { _id, createdAt, updatedAt, ...rest } = values;

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

        try {
            if (isUpdate) {
                await updateMutation.mutateAsync({ id: values._id, data: rest });
            } else {
                await createMutation.mutateAsync(rest);
            }
        } catch (err) {
            // Error handling in onError callbacks
        }
    };

    return (
        <MuiBox>
            <Formik initialValues={printingTemplate} validationSchema={validationSchema} enableReinitialize={true} onSubmit={handleSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, setFieldValue, handleSubmit: formikHandleSubmit, isSubmitting }) => (
                    <form onSubmit={formikHandleSubmit}>
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
                                <Grid>
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
                                <Grid>
                                    <IconButton aria-label="close" onClick={onClose}>
                                        <CloseIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>

                            <Grid container alignItems="center" justifyContent="flex-start" spacing={5} sx={{ mb: 2 }}>
                                <Grid sx={{ flexShrink: 0, minWidth: 450 }}>
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
                                        slotProps={{ htmlInput: { style: { textAlign: 'right', fontWeight: 400, fontSize: 14 } } }}
                                    />
                                </Grid>
                                <Grid>
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
                                <Grid>
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
                                <Grid>
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
                                                    <Grid sx={{ width: 250, flexShrink: 0, minWidth: 250 }}>
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
                                                    <Grid sx={{ width: 250, flexShrink: 0, minWidth: 250 }}>
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
                                                    <Grid sx={{ width: 570, flexShrink: 0, minWidth: 570 }}>
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
                                <Button
                                    type="submit"
                                    sx={{ marginBottom: '10px' }}
                                    variant="contained"
                                    color="primary"
                                    disabled={!hasChanges(values) || isSubmitting}
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
