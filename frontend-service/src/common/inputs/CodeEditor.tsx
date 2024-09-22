import { Editor, Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import React from 'react';

interface codeEditorProps {
    language: string;
    style: { height: string; width: string };
    onChange: (value: string | undefined, event: editor.IModelContentChangedEvent) => void;
    onMount: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
    value?: string;
    defaultValue?: string;
    onValidate?: (markers: editor.IMarker[]) => void;
}

export const CodeEditor: React.FC<codeEditorProps> = ({ language, style, value, defaultValue, onChange, onMount, onValidate }) => {
    return (
        <Editor
            height={style.height}
            width={style.width}
            onChange={onChange}
            defaultLanguage={language}
            defaultValue={defaultValue}
            onMount={onMount}
            onValidate={onValidate}
            value={value}
            options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
            }}
        />
    );
};
