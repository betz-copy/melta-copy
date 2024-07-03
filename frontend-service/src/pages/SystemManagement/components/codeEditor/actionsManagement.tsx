import React, { useRef, useState } from 'react';
import { editor } from 'monaco-editor';
import { Monaco } from '@monaco-editor/react';
import { CodeEditor } from '../../../../common/inputs/CodeEditor';
import { generateInterface } from '../../../../utils/jsonSchemToInterface-ts';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { Box, Typography } from '@mui/material';
import { constrainedEditor } from 'constrained-editor-plugin';
import i18next from 'i18next';

const ActionManagement: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated | null;
    onChange: (value: string | undefined, event: editor.IModelContentChangedEvent) => void;
    onValidate?: (markers: editor.IMarker[]) => void;
    forbidden?: boolean;
    value?: string;
}> = ({ entityTemplate, onChange, onValidate, forbidden = false, value }) => {
    const entityName = entityTemplate?.name;
    const entityProperties = entityTemplate?.properties.properties;
    const monacoRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const constrainedInstanceRef = useRef(null);

    const handleEditorDidMount = (editorDefs: editor.IStandaloneCodeEditor, monaco: Monaco) => {
        // eslint-disable-next-line no-param-reassign
        editorDefs.getDomNode()!.style.direction = 'ltr';
        monacoRef.current = editorDefs;
        const constrainedInstance = constrainedEditor(monaco);
        const model = editorDefs.getModel();
        const readonlyProperties = 4;
        const propertiesInterface = Object.keys(entityTemplate?.properties.properties!).length + readonlyProperties;
        const updateEntityFunction = 7;
        const numLineAfterDefaultLines = propertiesInterface + updateEntityFunction;

        constrainedInstance.initializeIn(editorDefs);

        const addRestrictions = (content: string) => {
            const lines = content.split('\n');
            const restrictions: { range: (number | undefined)[]; allowMultiline: boolean; label: string }[] = [];

            const functionDefinitionsLineNumbers: number[] = [];
            lines.forEach((line, index) => {
                if (
                    line.includes('function onCreateEntity') ||
                    line.includes('function onUpdateEntity') ||
                    line.includes('function onDeleteEntity')
                ) {
                    functionDefinitionsLineNumbers.push(index + 1);
                }
            });

            const numLinesBetweenOnCerateFuncAndDefaultLines = functionDefinitionsLineNumbers[0] - numLineAfterDefaultLines;

            for (let i = numLineAfterDefaultLines; i < numLineAfterDefaultLines + numLinesBetweenOnCerateFuncAndDefaultLines; i++) {
                restrictions.push({
                    range: [i, 1, i, model?.getLineMaxColumn(i)],
                    allowMultiline: true,
                    label: `editableArea${i}`,
                });
            }

            for (let i = 0; i < functionDefinitionsLineNumbers.length + 1; i++) {
                const start = functionDefinitionsLineNumbers[i] + 1;
                const endLine = functionDefinitionsLineNumbers[i + 1] ? functionDefinitionsLineNumbers[i + 1] - 1 : model?.getLineCount();
                for (let startLine = start; (endLine as unknown as number) - startLine >= 0; startLine++) {
                    restrictions.push({
                        range: [startLine, 1, startLine, model?.getLineMaxColumn(startLine)],
                        allowMultiline: true,
                        label: `editableArea${i}`,
                    });
                }
            }
            constrainedInstance.addRestrictionsTo(model, restrictions);
        };
        // that lines add editable lines: restrictions contains all editable lines
        if (entityTemplate?.actions) {
            addRestrictions(value!);
        } else {
            const lines = [
                { label: 'beforeFunctionOnCreateEntity', offset: 0 },
                { label: 'onCreateEntity', offset: 2 },
                { label: 'beforeFunctionOnUpdateEntity', offset: 4 },
                { label: 'onUpdateEntity', offset: 6 },
                { label: 'beforeFunctionOnDeleteEntity', offset: 8 },
                { label: 'onDeleteEntity', offset: 10 },
            ];

            const restrictions = lines.map((line) => {
                const lineNum = numLineAfterDefaultLines + line.offset;
                const maxColumn = model?.getLineMaxColumn(lineNum);
                return {
                    range: [lineNum, 1, lineNum, maxColumn],
                    allowMultiline: true,
                    label: line.label,
                };
            });

            constrainedInstance.addRestrictionsTo(model, restrictions);
        }

        constrainedInstanceRef.current = constrainedInstance;

        // const entityInterface = generateInterface(entityProperties!, entityName!);
        // monaco.languages.typescript.typescriptDefaults.addExtraLib(entityInterface, 'ts:entity/x.d.ts');
    };

    const defaultValue = [
        `${generateInterface(entityProperties!, entityName!)}`,
        '',
        'function updateEntity(entityId: string, properties: Record<string, any>): void {',
        '  // updates entity in data base',
        '}',
        '',
        `function onCreateEntity(${entityName}: ${entityName}): void {`,
        '',
        '}',
        '',
        `function onUpdateEntity(${entityName}: ${entityName}): void {`,
        '',
        '}',
        '',
        `function onDeleteEntity(${entityName}: ${entityName}): void {`,
        '',
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
            {forbidden && (
                <Typography color="error" variant="caption" fontSize="14px">
                    {`${i18next.t('systemManagement.entityAction.cantImport')} import`}
                </Typography>
            )}
        </Box>
    );
};

export { ActionManagement };
