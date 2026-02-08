import { AppRegistration as AppRegistrationIcon } from '@mui/icons-material';
import { Dialog, DialogContent, Grid, IconButton, Typography } from '@mui/material';
import { Field } from 'formik';
import i18next from 'i18next';
import { useState } from 'react';
import { useWorkspaceStore } from '../../../../stores/workspace';
import { EntityReference } from '../EntityReference';

const OpenEntityReference = ({ fieldName, values, errors, setFieldValue, touched, handleBlur, title, viewMode, children }) => {
    const [open, setOpen] = useState(false);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { headlineSubTitleFontSize } = workspace.metadata.mainFontSizes;
    const handleButtonClick = async () => {
        setOpen(true);
    };

    return (
        <Grid height="100%">
            <Grid style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }} height="100%">
                {(children && (
                    <Grid
                        height="100%"
                        onClick={() => {
                            handleButtonClick?.();
                        }}
                    >
                        {children}
                    </Grid>
                )) || (
                    <IconButton
                        sx={{ borderRadius: 10, maxWidth: '100%' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleButtonClick?.();
                        }}
                    >
                        <AppRegistrationIcon
                            sx={{
                                fontSize: workspace.metadata.mainFontSizes.headlineTitleFontSize,
                            }}
                        />
                        <Typography
                            sx={{
                                marginRight: '5px',
                                fontSize: headlineSubTitleFontSize,
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                            }}
                        >
                            {title}
                        </Typography>
                    </IconButton>
                )}
            </Grid>
            {open && (
                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                    <DialogContent sx={{ height: '30vh', p: 0 }}>
                        <Field
                            key={fieldName}
                            validate={(changedValue) => {
                                return (
                                    values.template?.details.properties.required.includes(fieldName) &&
                                    !changedValue?.entity &&
                                    i18next.t('validation.requiredEntity')
                                );
                            }}
                            name={`entityReferences.${fieldName}`}
                            component={EntityReference}
                            errorText={
                                errors.entityReferences?.[fieldName] && touched.entityReferences?.[fieldName]
                                    ? JSON.stringify(errors.entityReferences?.[fieldName])
                                    : undefined
                            }
                            field={fieldName || ''}
                            values={values}
                            errors={errors}
                            touched={touched}
                            setFieldValue={setFieldValue}
                            handleBlur={handleBlur}
                            isViewMode={viewMode}
                            title={title}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </Grid>
    );
};

export default OpenEntityReference;
