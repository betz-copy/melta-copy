import React, { useRef } from 'react';
import { editor } from 'monaco-editor';
import { Monaco } from '@monaco-editor/react';
import { Box, Typography } from '@mui/material';
import i18next from 'i18next';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { CodeEditor } from '../../../../common/inputs/CodeEditor';

interface ActionManagementProps {
    entityTemplate: IMongoEntityTemplatePopulated | null;
    onChange: (value: string | undefined, event: editor.IModelContentChangedEvent) => void;
    setEditorContent: React.Dispatch<React.SetStateAction<string>>;
    defaultCode: string;
    onValidate?: (markers: editor.IMarker[]) => void;
    forbidden?: boolean;
    value?: string;
    crudActions: string[];
}

const ActionManagement: React.FC<ActionManagementProps> = ({
    entityTemplate,
    onChange,
    onValidate,
    defaultCode,
    forbidden = false,
    value,
    setEditorContent,
    crudActions,
}) => {
    const entityName = entityTemplate?.name;
    const monacoRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    const handleEditorDidMount = (editorDefs: editor.IStandaloneCodeEditor, monaco: Monaco) => {
        // eslint-disable-next-line no-param-reassign
        editorDefs.getDomNode()!.style.direction = 'ltr';
        monacoRef.current = editorDefs;
        setEditorContent(monacoRef.current.getValue());

        // TODO: disable defaultCode

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

    const createBasicFunctions = (functionNames: string[], name: string) =>
        functionNames.flatMap((fnName) => [`function ${fnName}(${name}:${name}): void {`, '', '}', '']).join('\n');

    const defaultValue = [defaultCode, '', createBasicFunctions(crudActions, entityName!)].join('\n');

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
                <Typography color="error" variant="caption" fontSize="16px">
                    {`${i18next.t('systemManagement.entityAction.cantUseIn')} import`}
                </Typography>
            )}
        </Box>
    );
};

export { ActionManagement };
