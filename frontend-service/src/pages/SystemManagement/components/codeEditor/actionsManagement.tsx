import { Monaco } from '@monaco-editor/react';
import { Box, Typography } from '@mui/material';
import i18next from 'i18next';
import { editor } from 'monaco-editor';
import React, { useRef } from 'react';
import { CodeEditor } from '../../../../common/inputs/CodeEditor';

interface ActionManagementProps {
    onChange: (value: string | undefined, event: editor.IModelContentChangedEvent) => void;
    setEditorContent: React.Dispatch<React.SetStateAction<string>>;
    defaultValue: string;
    onValidate?: (markers: editor.IMarker[]) => void;
    forbidden?: boolean;
    value?: string;
}

const ActionManagement: React.FC<ActionManagementProps> = ({ onChange, onValidate, defaultValue, forbidden = false, value, setEditorContent }) => {
    const monacoRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    const handleEditorDidMount = (editorDefs: editor.IStandaloneCodeEditor, monaco: Monaco) => {
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
