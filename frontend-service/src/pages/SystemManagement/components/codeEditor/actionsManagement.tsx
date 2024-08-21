import React, { useRef } from 'react';
import { editor } from 'monaco-editor';
import { Monaco } from '@monaco-editor/react';
import { CodeEditor } from '../../../../common/inputs/CodeEditor';
import { generateInterfaceWithRelationships } from '../../../../utils/jsonSchemToInterface-ts';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { Box, Typography } from '@mui/material';
import { constrainedEditor } from 'constrained-editor-plugin';
import i18next from 'i18next';

interface ActionManagementProps {
    entityTemplate: IMongoEntityTemplatePopulated | null;
    onChange: (value: string | undefined, event: editor.IModelContentChangedEvent) => void;
    setEditorContent: React.Dispatch<React.SetStateAction<string>>;
    defaultCode: string;
    onValidate?: (markers: editor.IMarker[]) => void;
    forbidden?: boolean;
    value?: string;
}

const ActionManagement: React.FC<ActionManagementProps> = ({
    entityTemplate,
    onChange,
    onValidate,
    defaultCode,
    forbidden = false,
    value,
    setEditorContent,
}) => {
    const entityName = entityTemplate?.name;
    const entityProperties = entityTemplate?.properties.properties;
    const monacoRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const constrainedInstanceRef = useRef(null);
    const generatedInterface = generateInterfaceWithRelationships(entityProperties!, entityName!);

    const handleEditorDidMount = (editorDefs: editor.IStandaloneCodeEditor, monaco: Monaco) => {
        editorDefs.getDomNode()!.style.direction = 'ltr';
        monacoRef.current = editorDefs;
        setEditorContent(monacoRef.current.getValue());

        const constrainedInstance = constrainedEditor(monaco);
        const model = editorDefs.getModel();
        constrainedInstance.initializeIn(editorDefs);

        const updateEntityFunctionNumLines = 5;
        const numLinesOfInterface = generatedInterface.split('\n');
        const numLineAfterDefaultLines = numLinesOfInterface.length + updateEntityFunctionNumLines;

        const getFunctionDefinitionsLineNumbers = (lines: string[]): number[] => {
            return lines.reduce<number[]>((acc, line, index) => {
                if (line.includes('function onCreateEntity') || line.includes('function onUpdateEntity')) {
                    acc.push(index + 1);
                }
                return acc;
            }, []);
        };

        const createRestrictionsForFunctionDefinitions = (functionDefinitionsLineNumbers: number[], numLineAfterDefaultLines: number) => {
            const restrictions: { range: (number | undefined)[]; allowMultiline: boolean; label: string }[] = [];

            const numLinesBetweenOnCreateFuncAndDefaultLines = functionDefinitionsLineNumbers[0] - numLineAfterDefaultLines;

            // restrict lines between the default lines and the first function definition
            for (let i = numLineAfterDefaultLines; i < numLineAfterDefaultLines + numLinesBetweenOnCreateFuncAndDefaultLines; i++) {
                restrictions.push({
                    range: [i, 1, i, model?.getLineMaxColumn(i)],
                    allowMultiline: true,
                    label: `editableArea${i}`,
                });
            }

            // restrict lines for each function definition block
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

            return restrictions;
        };

        const createDefaultRestrictions = (numLineAfterDefaultLines: number) => {
            const lines = [
                { label: 'beforeFunctionOnCreateEntity', offset: 0 },
                { label: 'onCreateEntity', offset: 2 },
                { label: 'beforeFunctionOnUpdateEntity', offset: 4 },
                { label: 'onUpdateEntity', offset: 6 },
            ];

            return lines.map((line) => {
                const lineNum = numLineAfterDefaultLines + line.offset;
                const maxColumn = model?.getLineMaxColumn(lineNum);
                return {
                    range: [lineNum, 1, lineNum, maxColumn],
                    allowMultiline: true,
                    label: line.label,
                };
            });
        };

        // add editable lines: restrictions contains all editable lines
        if (entityTemplate?.actions) {
            const functionDefinitionsLineNumbers = getFunctionDefinitionsLineNumbers(editorDefs.getValue().split('\n'));
            const restrictions = createRestrictionsForFunctionDefinitions(functionDefinitionsLineNumbers, numLineAfterDefaultLines);
            constrainedInstance.addRestrictionsTo(model, restrictions);
        } else {
            const restrictions = createDefaultRestrictions(numLineAfterDefaultLines);
            constrainedInstance.addRestrictionsTo(model, restrictions);
        }

        constrainedInstanceRef.current = constrainedInstance;

        const customErrorLib = `
        class CustomError extends Error {
            constructor(message: string) {
                super(message);
                this.name = "CustomError";
            }
        }
        `;
        monaco.languages.typescript.typescriptDefaults.addExtraLib(customErrorLib, 'ts:custom-error-lib.d.ts');
    };

    const defaultValue = [
        `${defaultCode}`,
        '',
        `function onCreateEntity(${entityName}: ${entityName}): void {`,
        '',
        '}',
        '',
        `function onUpdateEntity(${entityName}: ${entityName}): void {`,
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
