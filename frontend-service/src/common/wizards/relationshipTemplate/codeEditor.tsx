import React, { useRef, useState } from 'react';
import { Box, Card, CardContent, CardHeader, IconButton } from '@mui/material';
import { constrainedEditor } from 'constrained-editor-plugin';
import { Editor, Monaco } from '@monaco-editor/react';
import { Clear } from '@mui/icons-material';
import i18next from 'i18next';
import { editor } from 'monaco-editor';
import { StepComponentProps } from '..';
import { RelationshipTemplateWizardValues } from '.';
import { AddIconWithText } from '../../AddIconWithText';
import { generateInterface } from '../../../utils/jsonSchemToInterface-ts';
import { CodeEditor } from '../../inputs/CodeEditor';

export const CodeEditor1: React.FC<StepComponentProps<RelationshipTemplateWizardValues>> = ({ values, touched, errors, setFieldValue }) => {
    const monacoRef = useRef(null);
    const constrainedInstanceRef = useRef(null);
    const [viewAction, setViewAction] = useState(false);
    const sourceEntityName = values.sourceEntity.name;
    const destinationEntityName = values.destinationEntity.name;
    const sourceProperties = values.sourceEntity.properties;
    const destProperties = values.destinationEntity.properties;

    let interfaceDefinition;
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

        editorDefs.setPosition(new monaco.Position(3, 5));

        const sourceInterface = generateInterface(sourceProperties.properties, sourceEntityName);
        const destInterface = generateInterface(destProperties.properties, destinationEntityName);

        monaco.languages.typescript.typescriptDefaults.addExtraLib(destInterface, 'ts:source/x.d.ts');
        monaco.languages.typescript.typescriptDefaults.addExtraLib(sourceInterface, 'ts:dest/x.d.ts');
    };

    const defaultValue = [
        `function onCreateRelationship(${sourceEntityName}: ${sourceEntityName}, ${destinationEntityName}: ${destinationEntityName}, createdRelId: string): { updated_${sourceEntityName}?: ${sourceEntityName}; updated_${destinationEntityName}?: ${destinationEntityName} } {`,
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
                        <CodeEditor
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
