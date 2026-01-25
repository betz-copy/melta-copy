import AddIcon from '@mui/icons-material/Add';
import { Button, DialogContent, Grid, Typography } from '@mui/material';
import { IMongoPrintingTemplate, IPrintingTemplateMap } from '@packages/printing-template';
import { FieldArray, Form, Formik, getIn } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { v4 } from 'uuid';
import * as Yup from 'yup';
import { IEntityTemplateMap } from '../../../interfaces/template';
import { createPrintingTemplateRequest, updatePrintingTemplateRequest } from '../../../services/templates/printingTemplateService';
import PrintSectionRow from './components/PrintSectionRow';
import Title from './components/Title';
import TopSection from './components/TopSection';

export interface PrintingTemplateCardProps {
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
    const entityTemplatesMap = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');
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
                    <Title printingTemplate={printingTemplate} onClose={onClose} />

                    <DialogContent>
                        <TopSection
                            values={values}
                            handleChange={handleChange}
                            handleBlur={handleBlur}
                            touched={touched}
                            errors={errors}
                            setFieldValue={setFieldValue}
                        />

                        <FieldArray name="sections">
                            {({ push, remove }) => (
                                <>
                                    {values.sections.map((section, idx) => {
                                        const entities = getEntitiesForCategory(section.categoryId).filter(
                                            (ent) => !values.sections.filter((_, i) => i !== idx).some((s) => s.entityTemplateId === ent._id),
                                        );
                                        const columns = getColumnsForEntityTemplate(section.entityTemplateId);
                                        const sectionError = getIn(errors, `sections[${idx}]`) || {};
                                        const sectionTouched = getIn(touched, `sections[${idx}]`) || {};
                                        return (
                                            <div key={v4()} style={{ marginTop: idx === 0 ? 0 : '1rem' }}>
                                                <PrintSectionRow
                                                    section={section}
                                                    entities={entities}
                                                    columns={columns}
                                                    idx={idx}
                                                    setFieldValue={setFieldValue}
                                                    remove={remove}
                                                    sectionTouched={sectionTouched}
                                                    sectionError={sectionError}
                                                />
                                            </div>
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
