import React, { useRef, useState } from 'react';
import { TextField, Box, Autocomplete } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQuery, useQueryClient } from 'react-query';
import { Editor } from '@monaco-editor/react';
import { constrainedEditor } from 'constrained-editor-plugin';
import { RelationshipTemplateWizardValues } from './index';
import { StepComponentProps } from '../index';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { variableNameValidation } from '../../../utils/validation';
import { getRelationshipInstancesCountByTemplateIdRequest } from '../../../services/entitiesService';
import { AddIconWithText } from '../../AddIconWithText';

const createRelationshipTemplateNameSchema = {
    name: Yup.string().matches(variableNameValidation, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
    displayName: Yup.string().required(i18next.t('validation.required')),
    sourceEntity: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
    destinationEntity: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
};

const CreateRelationshipTemplateName: React.FC<StepComponentProps<RelationshipTemplateWizardValues, 'isEditMode'>> = ({
    values,
    touched,
    errors,
    handleChange,
    setFieldValue,
    isEditMode,
}) => {
    const queryClient = useQueryClient();
    const [viewAction, setViewAction] = useState(false);
    const [valuee, setValue] = useState('');
    const [code, setCode] = useState('');
    const monacoRef = useRef(null);
    const constrainedInstanceRef = useRef(null);
    const restrictions = [];

    const onChange = (action, data) => {
        console.log(action, data);

        switch (action) {
            case 'code': {
                setCode(data);
                break;
            }
            default: {
                console.log('case not handled!', action, data);
            }
        }
    };

    const handleEditorChange = (val) => {
        setValue(val);
        // onChange('code', value);
    };

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');
    const entityTemplatesArray = Array.from(entityTemplates!.values());

    const { data: areThereRelationshipInstancesByTemplateId } = useQuery(
        ['areThereRelationshipInstancesByTemplateId', (values as RelationshipTemplateWizardValues & { _id: string })._id],
        () => getRelationshipInstancesCountByTemplateIdRequest((values as RelationshipTemplateWizardValues & { _id: string })._id),
        {
            enabled: isEditMode,
            initialData: 0,
        },
    );
    const handleEditorDidMount = (editor, monaco) => {
        // Apply LTR direction
        // eslint-disable-next-line no-param-reassign
        editor.getDomNode().style.direction = 'ltr';
        monaco.languages.registerCompletionItemProvider('javascript', {
            provideCompletionItems: () => {
                const suggestions = [
                    {
                        label: 'name',
                        kind: monaco.languages.CompletionItemKind.Property,
                        insertText: 'name',
                        detail: 'Person name',
                    },
                    {
                        label: 'age',
                        kind: monaco.languages.CompletionItemKind.Property,
                        insertText: 'age',
                        detail: 'Person age',
                    },
                    {
                        label: 'address',
                        kind: monaco.languages.CompletionItemKind.Property,
                        insertText: 'address',
                        detail: 'Person address',
                    },
                    {
                        label: 'city',
                        kind: monaco.languages.CompletionItemKind.Property,
                        insertText: 'city',
                        detail: 'City in address',
                    },
                    {
                        label: 'country',
                        kind: monaco.languages.CompletionItemKind.Property,
                        insertText: 'country',
                        detail: 'Country in address',
                    },
                ];
                return { suggestions };
            },
        });
    };
    // const handleEditorDidMount = (editor, monaco) => {
    //     monacoRef.current = editor;
    //     const constrainedInstance = constrainedEditor(monaco);
    //     const model = editor.getModel();

    //     constrainedInstance.initializeIn(editor);
    //     restrictions.push({
    //         range: [1, 1, 1, 1],
    //         allowMultiline: true,
    //     });

    //     constrainedInstance.addRestrictionsTo(model, restrictions);
    //     constrainedInstanceRef.current = constrainedInstance;
    // };

    // const handleResetCode = () => {
    //     const defaultCode = 'console.log("Hello, world!");';
    //     const model = monacoRef.current.getModel();
    //     model.setValue(defaultCode);
    //     setCode(defaultCode);
    // };

    // const handleUnmount = () => {
    //     if (constrainedInstanceRef.current) {
    //         constrainedInstanceRef.current.dispose();
    //     }
    // };

    return (
        <>
            <Box margin={1}>
                <TextField
                    name="name"
                    label={i18next.t('wizard.name')}
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    disabled={areThereRelationshipInstancesByTemplateId! > 0}
                />
            </Box>
            <Box margin={1}>
                <TextField
                    name="displayName"
                    label={i18next.t('wizard.displayName')}
                    value={values.displayName}
                    onChange={handleChange}
                    error={touched.displayName && Boolean(errors.displayName)}
                    helperText={touched.displayName && errors.displayName}
                />
            </Box>
            <Box margin={1}>
                <Autocomplete
                    id="sourceEntity"
                    options={entityTemplatesArray}
                    onChange={(_e, value) => setFieldValue('sourceEntity', value || '')}
                    value={values.sourceEntity._id ? values.sourceEntity : null}
                    getOptionLabel={(option) => option.displayName}
                    disabled={areThereRelationshipInstancesByTemplateId! > 0}
                    renderInput={(params) => (
                        <TextField
                            style={{ width: '220px' }}
                            {...params}
                            error={Boolean(touched.sourceEntity && errors.sourceEntity)}
                            fullWidth
                            helperText={touched.sourceEntity && errors.sourceEntity?._id}
                            name="sourceEntity"
                            variant="outlined"
                            label={i18next.t('wizard.relationshipTemplate.sourceEntity')}
                        />
                    )}
                />
            </Box>
            <Box margin={1}>
                <Autocomplete
                    id="destinationEntity"
                    options={entityTemplatesArray}
                    onChange={(_e, value) => setFieldValue('destinationEntity', value || '')}
                    value={values.destinationEntity._id ? values.destinationEntity : null}
                    disabled={areThereRelationshipInstancesByTemplateId! > 0}
                    getOptionLabel={(option) => option.displayName}
                    renderInput={(params) => (
                        <TextField
                            style={{ width: '220px' }}
                            {...params}
                            error={Boolean(touched.destinationEntity && errors.destinationEntity)}
                            fullWidth
                            helperText={touched.sourceEntity && errors.destinationEntity?._id}
                            name="destinationEntity"
                            variant="outlined"
                            label={i18next.t('wizard.relationshipTemplate.destinationEntity')}
                        />
                    )}
                />
            </Box>
            <AddIconWithText
                textStyle={{ display: 'flex', alignItems: 'center', fontSize: '14px', marginTop: '5px' }}
                iconStyle={{ marginLeft: '11px' }}
                text="הוספת פעולה"
                onClick={() => setViewAction(!viewAction)}
            />
            {viewAction && (
                <TextField
                    InputProps={{
                        // eslint-disable-next-line react/no-unstable-nested-components
                        inputComponent: () => (
                            <Editor
                                height="250px"
                                // theme="light"
                                onChange={onChange}
                                defaultLanguage="typescript"
                                defaultValue="// some comment"
                                onMount={handleEditorDidMount}
                            />
                        ),
                    }}
                    fullWidth
                    margin="dense"
                    variant="outlined"
                />
            )}
        </>
    );
};

export { CreateRelationshipTemplateName, createRelationshipTemplateNameSchema };
