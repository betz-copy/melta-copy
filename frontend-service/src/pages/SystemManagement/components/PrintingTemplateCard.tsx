import React from 'react';
import {
    Grid,
    Typography,
    TextField,
    IconButton,
    FormControlLabel,
    Button,
    Chip,
    MenuItem,
    InputLabel,
    Box as MuiBox,
    Autocomplete,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { IMongoPrintTemplate } from '../../../interfaces/printingTemplates';
import { useQueryClient } from 'react-query';
import { ICategoryMap } from '../../../interfaces/categories';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { useFormik, FormikProvider, FieldArray, getIn } from 'formik';
import * as Yup from 'yup';
import { MeltaCheckbox } from '../../../common/MeltaCheckbox';
import { BlueTitle } from '../../../common/BlueTitle';
import i18next from 'i18next';

interface PrintingTemplateCardProps {
    open: boolean;
    onClose: () => void;
    printingTemplate: IMongoPrintTemplate;
}

const sectionSchema = Yup.object().shape({
    categoryId: Yup.string().required('יש לבחור קטגוריה'),
    entityTemplateId: Yup.string().required('יש לבחור ישות'),
    selectedColumns: Yup.array().of(Yup.string()).min(1, 'יש לבחור לפחות עמודה אחת').max(8, 'ניתן לבחור עד 8 עמודות'),
});

const validationSchema = Yup.object().shape({
    name: Yup.string().required('יש להזין שם תבנית'),
    sections: Yup.array().of(sectionSchema).min(1, 'יש להוסיף לפחות מקטע אחד'),
});

const getInitialValues = (printingTemplate: IMongoPrintTemplate) => {
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

const CreateOrEditPrintTemplate: React.FC<PrintingTemplateCardProps> = ({ open, onClose, printingTemplate }) => {
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

    return (
        <MuiBox sx={{ direction: 'rtl' }}>
            <FormikProvider value={formik}>
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
                            <BlueTitle title={'הגדרות הדפסה'} component="h6" variant="h6"></BlueTitle>
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
                                placeholder="שם תבנית"
                                label="שם תבנית"
                                error={Boolean(formik.touched.name && formik.errors.name)}
                                inputProps={{ style: { textAlign: 'right' } }}
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
                                label={<Typography sx={{ fontWeight: 400, fontSize: 14 }}>הוספת שדה החתמה בסוף</Typography>}
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
                                label={<Typography sx={{ fontWeight: 400, fontSize: 14 }}>הוספת תיבת סימון לכל ישות</Typography>}
                                labelPlacement="start"
                                sx={{ ml: 0 }}
                            />
                        </Grid>
                        <Grid item>
                            <FormControlLabel
                                control={
                                    <MeltaCheckbox
                                        checked={formik.values.compactView}
                                        onChange={(_, checked) => formik.setFieldValue('compactView', checked)}
                                    />
                                }
                                label={<Typography sx={{ fontWeight: 400, fontSize: 14 }}>תצוגה קומפקטית</Typography>}
                                labelPlacement="start"
                                sx={{ mr: 0 }}
                            />
                        </Grid>
                    </Grid>
                    {formik.touched.name && formik.errors.name && (
                        <Grid container justifyContent="flex-end" sx={{ mb: 1 }}>
                            <Typography color="error" fontWeight={500} fontSize={14} textAlign="right">
                                {formik.errors.name}
                            </Typography>
                        </Grid>
                    )}
                    <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
                        <Typography color="#9398C2" fontSize={14} textAlign="right">
                            שימו לב! טבלאות אשר לא יוגדרו במסך זה יודפסו עם עמודות התצוגה המקדימה שלהן בלבד
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
                                            <Grid item>
                                                <IconButton onClick={() => remove(idx)} size="small">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Grid>
                                            <Grid item sx={{ minWidth: 180, flex: 1 }}>
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
                                                            label="קטגוריה"
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
                                            <Grid item sx={{ minWidth: 180, flex: 1 }}>
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
                                                            label="ישות"
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
                                            <Grid item sx={{ minWidth: 220, flex: 1 }}>
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
                                                            label="עמודות להדפסה"
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
                </MuiBox>
            </FormikProvider>
        </MuiBox>
    );
};

export default CreateOrEditPrintTemplate;
