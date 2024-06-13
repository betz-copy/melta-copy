import { Editor, Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import React from 'react';

interface codeEditorProps {
    onChange: (value: string | undefined, event: editor.IModelContentChangedEvent) => void;
    onMount: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
    language: string;
    style: { height: string; width: string };
    defaultValue?: string;
}

export const CodeEditor1: React.FC<codeEditorProps> = ({ defaultValue, onChange, onMount, language, style }) => {
    return (
        <Editor
            height={style.height}
            width={style.width}
            onChange={onChange}
            defaultLanguage={language}
            defaultValue={defaultValue}
            onMount={onMount}
            // value={values.action}
            options={{
                minimap: { enabled: false },
                scrollbar: { handleMouseWheel: true },
            }}
        />
    );
};
