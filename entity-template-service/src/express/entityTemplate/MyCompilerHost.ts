/* eslint-disable class-methods-use-this */
import * as ts from 'typescript';
import MyLanguageServiceHost from './MyLanguageServiceHost';

export default class MyCompilerHost extends MyLanguageServiceHost implements ts.CompilerHost {
    constructor(public compilationSettings: ts.CompilerOptions) {
        super(compilationSettings);
    }

    getSourceFile(filename: string, languageVersion: ts.ScriptTarget, _onError?: (message: string) => void): ts.SourceFile {
        const text = this.files[filename];
        if (!text) console.log('nooo');
        return ts.createSourceFile(filename, text, languageVersion);
    }

    writeFile = (_filename: string, _data: string, _writeByteOrderMark: boolean, _onError?: (message: string) => void) => {};

    getCanonicalFileName = (fileName: string) => fileName;

    useCaseSensitiveFileNames = () => true;

    getNewLine = () => '\n';

    getDirectories = (path) => ts.sys.getDirectories(path);

    fileExists = (fileName) => ts.sys.fileExists(fileName);

    readFile = (fileName) => {
        const f = ts.sys.readFile(fileName);
        return f ?? '';
    };
}
