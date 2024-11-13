// import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
// import { Box, Card, CardActions, Fab, Grid, Typography } from '@mui/material';
// import { Field, FormikProps } from 'formik';
// import i18next from 'i18next';
// import pickBy from 'lodash.pickby';
// import React, { useEffect, useState } from 'react';
// import { IDetailsStepProp, ProcessDetailsValues } from '.';
// import { IMongoProcessTemplatePopulated, IProcessSingleProperty } from '../../../../interfaces/processes/processTemplate';
// import { pickProcessFieldsPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
// import { setInitialStepsObject } from '../../../../utils/processWizard/steps';
// import { BlueTitle } from '../../../BlueTitle';
// import OpenPreview from '../../../FilePreview/OpenPreview';
// import { InstanceFileInput } from '../../../inputs/InstanceFilesInput/InstanceFileInput';
// import { JSONSchemaFormik } from '../../../inputs/JSONSchemaFormik';
// import { EntityReference } from '../EntityReference';
// import { ProcessStepValues } from '../ProcessSteps';
// import { initDetailsValues } from './detailsFormik';
// import { InstanceSingleFileInput } from '../../../inputs/InstanceFilesInput/InstanceSingleFileInput';
// import { TextAreaProperty } from '../ProcessSteps/processStep';
// import { renderHTML } from '../../../../utils/HtmlTagsStringValue';
// import GeneralDetails from './GeneralDetails';

// export const SchemaForm = ({ viewMode, values, errors, touched, setFieldValue, setFieldTouched, toPrint }) => {
//     const schema = pickProcessFieldsPropertiesSchema(values.template.details);
//     const textAreaSchema = Object.entries(schema.properties)
//         .filter(([_key, property]) => property.format === 'text-area')
//         .map(([key, property]) => ({
//             key,
//             title: property.title,
//         }));

//     const textAreaValues = textAreaSchema.flatMap((property) => {
//         if (values.details[property.key]) {
//             const value = renderHTML(values.details[property.key]);
//             return [{ ...property, value }];
//         }
//         return [{ ...property }];
//     });

//     return (
//         <Box paddingTop={0.5} paddingLeft={1}>
//             <BlueTitle
//                 title={i18next.t('wizard.entityTemplate.properties')}
//                 style={{ marginTop: toPrint ? '30px' : undefined }}
//                 component="h6"
//                 variant="h6"
//             />
//             <JSONSchemaFormik
//                 schema={schema}
//                 values={{ ...values, properties: values.details }}
//                 setValues={(propertiesValues) => setFieldValue('details', propertiesValues)}
//                 errors={errors.details ?? {}}
//                 touched={touched.details ?? {}}
//                 setFieldTouched={(field) => setFieldTouched(`details.${field}`)}
//                 readonly={viewMode}
//                 toPrint={toPrint}
//             />
//             {toPrint && textAreaValues.length > 0 && textAreaValues.map((textArea) => <TextAreaProperty key={textArea.key} textArea={textArea} />)}
//         </Box>
//     );
// };

// type ProcessFormikProps = ProcessStepValues | ProcessDetailsValues;

// type FileAttachmentsProps = {
//     templateFileProperties: Record<string, IProcessSingleProperty>;
//     values: any;
//     errors?: any;
//     setFieldValue?: (field: string, value: any) => void;
//     required?: string[];
//     touched: FormikProps<ProcessDetailsValues>['touched'];
//     setFieldTouched: FormikProps<ProcessFormikProps>['setFieldTouched'];
//     toPrint?: boolean;
// };

// const FileAttachmentsEdit: React.FC<FileAttachmentsProps> = ({
//     templateFileProperties,
//     values,
//     errors,
//     touched,
//     setFieldTouched,
//     setFieldValue = () => {},
//     required = [],
// }) => (
//     <>
//         {Object.entries(templateFileProperties).map(([key, value], index) => (
//             <Grid item key={key} marginTop={index > 0 ? 5 : 0}>
//                 {value.items === undefined ? (
//                     <InstanceSingleFileInput
//                         key={key}
//                         fileFieldName={`detailsAttachments.${key}`}
//                         fieldTemplateTitle={value.title}
//                         setFieldValue={setFieldValue}
//                         required={required.includes(key)} // file error
//                         value={values.detailsAttachments[key]}
//                         error={
//                             errors.detailsAttachments?.[key] && touched.detailsAttachments?.[key]
//                                 ? JSON.stringify(errors.detailsAttachments?.[key])
//                                 : undefined
//                         }
//                         setFieldTouched={setFieldTouched}
//                     />
//                 ) : (
//                     <InstanceFileInput
//                         key={key}
//                         fileFieldName={`detailsAttachments.${key}`}
//                         fieldTemplateTitle={value.title}
//                         setFieldValue={setFieldValue}
//                         required={required.includes(key)}
//                         value={values.detailsAttachments[key]}
//                         error={
//                             errors.detailsAttachments?.[key] && touched.detailsAttachments?.[key]
//                                 ? JSON.stringify(errors.detailsAttachments?.[key])
//                                 : undefined
//                         }
//                         setFieldTouched={setFieldTouched}
//                     />
//                 )}
//             </Grid>
//         ))}
//     </>
// );

// export const FileAttachmentsView: React.FC<FileAttachmentsProps> = ({ templateFileProperties, values, toPrint }) => {
//     return (
//         <>
//             {Object.entries(templateFileProperties).map(([fieldName, { title }]) => {
//                 let attachments: React.JSX.Element | React.JSX.Element[] = (
//                     <Typography display="inline" variant="h6">
//                         -
//                     </Typography>
//                 );
//                 if (values.detailsAttachments[fieldName]) {
//                     if (Array.isArray(values.detailsAttachments[fieldName])) {
//                         attachments = values.detailsAttachments[fieldName].map((v) => <OpenPreview key={v} fileId={v.name} download={toPrint} />);
//                     } else {
//                         attachments = <OpenPreview fileId={values.detailsAttachments[fieldName].name} download={toPrint} />;
//                     }
//                 }
//                 return (
//                     <Grid container spacing={1} display="flex" flexDirection="column" key={fieldName}>
//                         <Grid item>
//                             <Typography display="inline" variant="body1">
//                                 {title}:
//                             </Typography>
//                         </Grid>
//                         <Grid item sx={{ overflowY: 'auto', maxHeight: '90px' }}>
//                             {attachments}
//                         </Grid>
//                     </Grid>
//                 );
//             })}
//         </>
//     );
// };

// export const FileAttachments = ({ viewMode, templateFileProperties, values, errors, touched, setFieldValue, required, setFieldTouched, toPrint }) => {
//     return (
//         <Box>
//             <BlueTitle title={i18next.t('wizard.entityTemplate.attachments')} component="h6" variant="h6" style={{ marginBottom: '22px' }} />
//             {!viewMode ? (
//                 <FileAttachmentsEdit
//                     templateFileProperties={templateFileProperties}
//                     values={values}
//                     errors={errors}
//                     touched={touched}
//                     setFieldValue={setFieldValue}
//                     required={required}
//                     setFieldTouched={setFieldTouched}
//                 />
//             ) : (
//                 <FileAttachmentsView
//                     templateFileProperties={templateFileProperties}
//                     values={values}
//                     touched={touched}
//                     setFieldTouched={setFieldTouched}
//                     toPrint={toPrint}
//                 />
//             )}
//         </Box>
//     );
// };

// const GeneralDetailsWithTemplateFields: React.FC<IDetailsStepProp> = ({
//     detailsFormikData,
//     onNext,
//     processInstance,
//     isEditMode,
//     toPrint,
//     onBack,
// }) => {
//     const { values, touched, errors, setFieldValue, setFieldTouched, handleBlur, resetForm } = detailsFormikData;
//     const [previousTemplate, setPreviousTemplate] = useState<IMongoProcessTemplatePopulated>();
//     const viewMode = Boolean(processInstance && !isEditMode);
//     const variant = viewMode ? 'standard' : 'outlined';
//     const templateFileProperties = values.template
//         ? pickBy(
//               values.template.details.properties.properties,
//               (value) => (value.type === 'array' && value.items?.format === 'fileId') || value.format === 'fileId',
//           )
//         : undefined;

//     const templateEntityReferenceProperties = values.template
//         ? pickBy(values.template.details.properties.properties, (value) => value.format === 'entityReference')
//         : undefined;

//     useEffect(() => {
//         if (values.template) {
//             setPreviousTemplate(values.template);
//             if (!processInstance) {
//                 if (values.template.name !== previousTemplate?.name) {
//                     resetForm({
//                         values: {
//                             template: values.template,
//                             details: initDetailsValues(values.template),
//                             detailsAttachments: {},
//                             endDate: null,
//                             entityReferences: {},
//                             name: '',
//                             startDate: null,
//                             steps: {},
//                         },
//                     });
//                 }
//                 setFieldValue('steps', setInitialStepsObject(values.template.steps));
//             }
//         }
//     }, [values.template?._id]);

//     return (
//         <Card sx={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
//             <GeneralDetails
//                 detailsFormikData={detailsFormikData}
//                 onNext={onNext}
//                 isEditMode={isEditMode}
//                 processInstance={processInstance}
//                 onBack={onBack}
//             />
//             {values.template && (
//                 <Grid
//                     item
//                     sx={{
//                         overflowY: 'auto',
//                         paddingLeft: toPrint ? 0 : 3,
//                     }}
//                     xs={toPrint ? 15 : 7}
//                 >
//                     {Object.keys(pickProcessFieldsPropertiesSchema(values.template.details).properties).length !== 0 && (
//                         <SchemaForm {...{ viewMode, values, errors, touched, setFieldValue, setFieldTouched, toPrint }} />
//                     )}
//                     {Object.keys(templateFileProperties!).length !== 0 && (
//                         <FileAttachments
//                             {...{
//                                 viewMode,
//                                 templateFileProperties,
//                                 values,
//                                 errors,
//                                 setFieldValue,
//                                 required: values.template.details.properties.required || [],
//                                 touched,
//                                 handleBlur,
//                                 setFieldTouched,
//                                 toPrint,
//                             }}
//                         />
//                     )}
//                     {Object.keys(templateEntityReferenceProperties!).length !== 0 && (
//                         <Grid padding={1}>
//                             <BlueTitle
//                                 title={i18next.t('wizard.processInstance.refEntities')}
//                                 component="h6"
//                                 variant="h6"
//                                 style={{ marginBottom: '22px' }}
//                             />
//                             {Object.entries(templateEntityReferenceProperties!).map(([fieldName, { title }]) => (
//                                 <Field
//                                     key={fieldName}
//                                     validate={(changedValue) => {
//                                         return (
//                                             values.template?.details.properties.required.includes(fieldName) &&
//                                             !changedValue?.entity &&
//                                             i18next.t('validation.requiredEntity')
//                                         );
//                                     }}
//                                     name={`entityReferences.${fieldName}`}
//                                     component={EntityReference}
//                                     errorText={
//                                         errors.entityReferences?.[fieldName] && touched.entityReferences?.[fieldName]
//                                             ? JSON.stringify(errors.entityReferences?.[fieldName])
//                                             : undefined
//                                     }
//                                     field={fieldName || ''}
//                                     values={values}
//                                     errors={errors}
//                                     touched={touched}
//                                     setFieldValue={setFieldValue}
//                                     handleBlur={handleBlur}
//                                     isViewMode={viewMode}
//                                     title={title}
//                                 />
//                             ))}
//                         </Grid>
//                     )}
//                 </Grid>
//             )}
//             {!toPrint && (
//                 <CardActions dir="ltr">
//                     <Grid item>
//                         {values.template && (
//                             <Fab
//                                 onClick={() => {
//                                     onNext();
//                                 }}
//                                 variant="extended"
//                                 color="primary"
//                             >
//                                 <NavigateBeforeIcon />
//                                 {i18next.t(viewMode ? 'wizard.processInstance.showStepsReviewers' : 'wizard.processInstance.moveToStepsReviewers')}
//                             </Fab>
//                         )}
//                     </Grid>
//                 </CardActions>
//             )}
//         </Card>
//     );
// };

// export default GeneralDetailsWithTemplateFields;
