/* eslint-disable class-methods-use-this */
import * as ts from 'typescript';
import {} from 'fs';

export default class MyLanguageServiceHost implements ts.CompilerHost {
    files: { [fileName: string]: string } = {};

    compilationSettings: ts.CompilerOptions;

    constructor(settings: ts.CompilerOptions) {
        this.compilationSettings = settings;
    }

    getSourceFile(filename: string, languageVersion: ts.ScriptTarget, _onError?: (message: string) => void): ts.SourceFile {
        const text = this.files[filename];
        if (!text) console.log('nooo');
        return ts.createSourceFile(filename, text, languageVersion);
    }

    getCompilationSettings = () => this.compilationSettings;

    getDefaultLibFileLocation = () => ts.getDefaultLibFilePath(this.getCompilationSettings());

    getDefaultLibFileName = (_) => this.getDefaultLibFileLocation();

    getDirectories = (_path: string): string[] => [];

    writeFile = (_filename: string, _data: string, _writeByteOrderMark: boolean, _onError?: (message: string) => void) => {};

    getCurrentDirectory = () => ts.sys.getCurrentDirectory();

    getCanonicalFileName = (fileName: string) => fileName;

    useCaseSensitiveFileNames = () => true;

    getNewLine = () => '\n';

    fileExists = (fileName: string) => !!this.files[fileName];

    readFile = (fileName: string) => this.files[fileName];

    addFile(fileName: string, body: string) {
        this.files[fileName] = body;
    }
}
