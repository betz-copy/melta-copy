import React, { useState } from 'react';
import { Box, Card, CardContent, CardHeader, IconButton } from '@mui/material';
import { Clear } from '@mui/icons-material';
import i18next from 'i18next';
import { editor } from 'monaco-editor';
import { Monaco } from '@monaco-editor/react';
import { CodeEditor1 } from '../../inputs/CodeEditor';
import { AddIconWithText } from '../../AddIconWithText';
import { generateInterface } from '../../../utils/jsonSchemToInterface-ts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

const ActionManagement: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated | null;
    onChange: (value: string | undefined, event: editor.IModelContentChangedEvent) => void;
}> = ({ entityTemplate, onChange }) => {
    const [viewAction, setViewAction] = useState(true);

    const entityName = entityTemplate?.name;
    const entityProperties = entityTemplate?.properties.properties;

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

        const entityInterface = generateInterface(entityProperties!, entityName!);
        monaco.languages.typescript.typescriptDefaults.addExtraLib(entityInterface, 'ts:entity/x.d.ts');
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
                        <CodeEditor1
                            style={{ height: '250px', width: '800px' }}
                            language="typescript"
                            onChange={onChange}
                            onMount={handleEditorDidMount}
                            defaultValue={defaultValue}
                        />
                    </CardContent>
                </Card>
            ) : (
                <AddIconWithText
                    textStyle={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        fontSize: '14px',
                        marginTop: '5px',
                    }}
                    iconStyle={{ marginLeft: '11px' }}
                    text={i18next.t('wizard.relationshipTemplate.addAction')}
                    onClick={() => {
                        setViewAction(!viewAction);
                    }}
                />
            )}
        </Box>
    );
};

export { ActionManagement };
