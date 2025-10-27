/* eslint-disable new-cap */
/* eslint-disable import/no-unresolved */

import { Editor, loader, Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import React from 'react';
import { useDarkModeStore } from '../../stores/darkMode';

interface codeEditorProps {
    language: string;
    style: { height: string; width: string };
    onChange: (value: string | undefined, event: editor.IModelContentChangedEvent) => void;
    onMount: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
    value?: string;
    defaultValue?: string;
    onValidate?: (markers: editor.IMarker[]) => void;
}

// eslint-disable-next-line no-restricted-globals
self.MonacoEnvironment = {
    getWorker(_, label) {
        switch (label) {
            case 'json':
                return new jsonWorker();
            case 'css':
            case 'scss':
            case 'less':
                return new cssWorker();
            case 'html':
            case 'handlebars':
            case 'razor':
                return new htmlWorker();
            case 'typescript':
            case 'javascript':
                return new tsWorker();
            default:
                return new editorWorker();
        }
    },
};

loader.config({ monaco });

export const CodeEditor: React.FC<codeEditorProps> = ({ language, style, value, defaultValue, onChange, onMount, onValidate }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

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
            theme={darkMode ? 'vs-dark' : 'light'}
        />
    );
};
