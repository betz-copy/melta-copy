import React, { useState } from 'react';
import { Box, Card, CardContent, CardHeader, IconButton } from '@mui/material';
import { Clear } from '@mui/icons-material';
import i18next from 'i18next';
import { editor } from 'monaco-editor';
import { Monaco } from '@monaco-editor/react';
import { StepComponentProps } from '..';
import { CodeEditor1 } from '../../inputs/CodeEditor';
import { EntityTemplateWizardValues } from '../entityTemplate';
import { AddIconWithText } from '../../AddIconWithText';
import { generateInterface } from '../../../utils/jsonSchemToInterface-ts';
import { AddActionWizardValues } from '.';

const ActionManagement: React.FC<StepComponentProps<EntityTemplateWizardValues, 'isEditMode'>> = ({
    values,
    touched,
    errors,
    handleChange,
    setFieldValue,
    isEditMode,
}) => {
    console.log({ values, touched, errors, handleChange, setFieldValue, isEditMode });
    const [viewAction, setViewAction] = useState(true);
    const entityName = values.name;
    const entityProperties = values.properties;

    const handleEditorDidMount = (editorDefs: editor.IStandaloneCodeEditor, monaco: Monaco) => {
        // eslint-disable-next-line no-param-reassign
        editorDefs.getDomNode()!.style.direction = 'ltr';
        // monacoRef.current = editor;
        // const constrainedInstance = constrainedEditor(monaco);
        // const model = editor.getModel();

        // constrainedInstance.initializeIn(editor);
        // constrainedInstance.addRestrictionsTo(model, [
        //     {
        //         range: [3, 1, 3, 1],
        //         allowMultiline: true,
        //         label: 'funcDefinition',
        //     },
        // ]);
        // constrainedInstanceRef.current = constrainedInstance;

        // editorDefs.setPosition(new monaco.Position(3, 5));

        // const sourceInterface = generateInterface(sourceProperties.properties, sourceEntityName);
        // const destInterface = generateInterface(destProperties.properties, destinationEntityName);
        const entityInterface = generateInterface(entityProperties, entityName);
        monaco.languages.typescript.typescriptDefaults.addExtraLib(entityInterface, 'ts:entity/x.d.ts');
        // monaco.languages.typescript.typescriptDefaults.addExtraLib(sourceInterface, 'ts:dest/x.d.ts');
    };

    const defaultValue = [
        `function onCreateEntity(${entityName}: ${entityName}): { updated_${entityName}?: ${entityName}; } {`,
        '    return {',
        '',
        '    }',
        '}',
    ].join('\n');

    return (
        <Box>
            {viewAction ? (
                <Card variant="outlined" sx={{ overflowX: 'auto', backgroundColor: 'white' }}>
                    <CardHeader
                        action={
                            <IconButton onClick={() => setViewAction(false)}>
                                <Clear />
                            </IconButton>
                        }
                    />
                    <CardContent>
                        {/* <Editor
                            height="250px"
                            width="800px"
                            onChange={(_e, value) => setFieldValue('action', value || '')}
                            defaultLanguage="typescript"
                            defaultValue={defaultValue}
                            onMount={handleEditorDidMount}
                            // value={values.action}
                            options={{
                                minimap: { enabled: false },
                                scrollbar: { handleMouseWheel: true },
                            }}
                        /> */}
                        <CodeEditor1
                            style={{ height: '250px', width: '800px' }}
                            language="typescript"
                            onChange={(_e, value) => setFieldValue('action', value || '')}
                            onMount={handleEditorDidMount}
                            defaultValue={defaultValue}
                        />
                    </CardContent>
                </Card>
            ) : (
                <AddIconWithText
                    textStyle={{ display: 'flex', alignItems: 'center', fontSize: '14px', marginTop: '5px' }}
                    iconStyle={{ marginLeft: '11px' }}
                    text={i18next.t('wizard.relationshipTemplate.addAction')}
                    onClick={() => {
                        setViewAction(!viewAction);
                        setFieldValue('action', undefined);
                    }}
                />
            )}
        </Box>
    );
};

export { ActionManagement };
