import React, { useState } from 'react';
import { editor } from 'monaco-editor';
import { Monaco } from '@monaco-editor/react';
import { CodeEditor } from '../../inputs/CodeEditor';
import { generateInterface } from '../../../utils/jsonSchemToInterface-ts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { Box } from '@mui/material';

const ActionManagement: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated | null;
    onChange: (value: string | undefined, event: editor.IModelContentChangedEvent) => void;
    onValidate?: (markers: editor.IMarker[]) => void;
    forbidden?: boolean;
    value?: string;
}> = ({ entityTemplate, onChange, onValidate, forbidden = false, value }) => {
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
        '',
        `function onUpdateEntity(${entityName}: ${entityName}): { updated_${entityName}?: ${entityName}; } {`,
        '    return {',
        '',
        '    }',
        '}',
        '',
        `function onDeleteEntity(${entityName}: ${entityName}): { updated_${entityName}?: ${entityName}; } {`,
        '    return {',
        '',
        '    }',
        '}',
    ].join('\n');

    return (
        <Box>
            <CodeEditor
                style={{ height: '795px', width: '100%' }}
                language="typescript"
                onChange={onChange}
                onMount={handleEditorDidMount}
                defaultValue={defaultValue}
                onValidate={onValidate}
                value={value}
            />
            {forbidden && <div style={{ color: 'red' }}>אין להשתמש בimport</div>}
        </Box>
    );
};

export { ActionManagement };
