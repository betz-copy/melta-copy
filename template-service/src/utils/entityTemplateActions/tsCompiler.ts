import * as fs from 'node:fs';
import * as path from 'node:path';
import { BadRequestError } from '@microservices/shared';
import * as ts from 'typescript-actions';

const createCustomCompilerHost = (
    defaultCompilerHost: ts.CompilerHost,
    filename: string,
    sourceFile: ts.SourceFile,
    options: ts.CompilerOptions,
): ts.CompilerHost => {
    const {
        getDefaultLibFileName,
        getSourceFile,
        useCaseSensitiveFileNames,
        getDirectories,
        fileExists,
        getCanonicalFileName,
        getCurrentDirectory,
        getNewLine,
        readFile,
    } = defaultCompilerHost;

    return {
        getSourceFile: (name, languageVersion) => {
            if (name === filename) return sourceFile;

            if (name === getDefaultLibFileName(options)) {
                const libFilePath = path.join(path.dirname(require.resolve('typescript')), 'lib', name);
                const libFileContent = fs.readFileSync(libFilePath, 'utf8');
                return ts.createSourceFile(name, libFileContent, languageVersion);
            }
            return getSourceFile(name, languageVersion);
        },
        writeFile: (_filename, _data) => {},
        getDefaultLibFileName,
        useCaseSensitiveFileNames,
        getCanonicalFileName,
        getCurrentDirectory,
        getNewLine,
        getDirectories: getDirectories || (() => []),
        fileExists,
        readFile,
    };
};

const handleDiagnostics = (diagnostics: readonly ts.Diagnostic[]) => {
    diagnostics.forEach((diagnostic) => {
        const { category, file, messageText } = diagnostic;

        if (category !== ts.DiagnosticCategory.Error) return;

        const message = ts.flattenDiagnosticMessageText(messageText, '\n');

        if (file) {
            const { line, character } = ts.getLineAndCharacterOfPosition(file, diagnostic.start!);
            throw new BadRequestError(`[validate entityTemplate actions]: ${file.fileName} (${line + 1},${character + 1}): ${message}`);
        }

        throw new BadRequestError(`[validate entityTemplate actions]: ${message}`);
    });
};

export const compileTsCode = (filename: string, sourceFile: ts.SourceFile) => {
    const options: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS,
        lib: ['lib.esnext.full.d.ts'],
    };

    const defaultCompilerHost = ts.createCompilerHost(options);
    const customCompilerHost = createCustomCompilerHost(defaultCompilerHost, filename, sourceFile, options);

    const program = ts.createProgram([filename], options, customCompilerHost);

    const allDiagnostics = [...ts.getPreEmitDiagnostics(program), ...program.emit().diagnostics];

    handleDiagnostics(allDiagnostics);
};
