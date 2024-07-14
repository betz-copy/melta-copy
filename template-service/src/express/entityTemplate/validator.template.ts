import { Request } from 'express';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import EntityTemplateManager from './manager';
import { IEntityTemplatePopulated } from './interface';
import { generateInterface } from '../../utils/generateInterfaceFromEntityTemplateProperties';

const cleanActionCode = (action: string, entityTemplate: IEntityTemplatePopulated) => {
    const defaultCode = [
        `${generateInterface(entityTemplate.properties.properties, entityTemplate.name)}`,
        '',
        'function updateEntity(entityId: string, properties: Record<string, any>): void {',
        '  // updates entity in data base',
        '}',
    ].join('\n');

    return action.slice(defaultCode.length + 1);
};

export const validateActionAst = async (req: Request) => {
    const { actions } = req.body;
    const { templateId } = req.params;

    const entityTemplate = await EntityTemplateManager.getTemplateById(templateId);

    const filename = 'test.ts';

    const sourceFile = ts.createSourceFile(filename, actions, ts.ScriptTarget.ES5);

    const options: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS,
        lib: ['lib.esnext.full.d.ts'],
    };

    const defaultCompilerHost = ts.createCompilerHost(options);

    const customCompilerHost: ts.CompilerHost = {
        getSourceFile: (name, languageVersion) => {
            // console.log(`getSourceFile ${name}`);
            if (name === filename) {
                return sourceFile;
            }
            if (name === defaultCompilerHost.getDefaultLibFileName(options)) {
                const libFilePath = path.join(path.dirname(require.resolve('typescript')), 'lib', name);
                const libFileContent = fs.readFileSync(libFilePath, 'utf8');
                return ts.createSourceFile(name, libFileContent, languageVersion);
            }
            return defaultCompilerHost.getSourceFile(name, languageVersion);
        },
        writeFile: (_filename, _data) => {},
        getDefaultLibFileName: (options1) => defaultCompilerHost.getDefaultLibFileName(options1),
        useCaseSensitiveFileNames: () => defaultCompilerHost.useCaseSensitiveFileNames(),
        getCanonicalFileName: (filename1) => defaultCompilerHost.getCanonicalFileName(filename1),
        getCurrentDirectory: () => defaultCompilerHost.getCurrentDirectory(),
        getNewLine: () => defaultCompilerHost.getNewLine(),
        getDirectories: (path1) => (defaultCompilerHost.getDirectories ? defaultCompilerHost.getDirectories(path1) : []),
        fileExists: (filename1) => defaultCompilerHost.fileExists(filename1),
        readFile: (filename1) => defaultCompilerHost.readFile(filename1),
    };

    const program = ts.createProgram([filename], options, customCompilerHost);

    const allDiagnostics = [...ts.getPreEmitDiagnostics(program), ...program.emit().diagnostics];

    allDiagnostics.forEach((diagnostic) => {
        if (diagnostic.category === ts.DiagnosticCategory.Error) {
            if (diagnostic.file) {
                const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
                const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
            } else {
                console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
            }
        }
    });
    // const checker = program.getTypeChecker();
    // const undefinedVariables: string[] = [];
    // const nameOfFunctionMustBe = ['onCreateEntity', 'onUpdateEntity', 'onDeleteEntity'];
    // const countNumOfOccurrences: Record<string, number> = {};

    // function visit(node: ts.Node, definedVariables: ts.Identifier[]) {
    //     const newVariables: ts.Identifier[] = [];

    //     if (ts.isVariableDeclaration(node)) {
    //         return {} as ts.Identifier;
    //     }
    //     if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
    //         newVariables.push(...node.parameters);
    //         const functionName = node.name?.getText();
    //         if (functionName && nameOfFunctionMustBe.includes(functionName)) {
    //             countNumOfOccurrences[functionName] = (countNumOfOccurrences[functionName] || 0) + 1;
    //         }
    //     }

    //     if (ts.isIdentifier(node)) {
    //         const symbol = checker.getSymbolAtLocation(node);
    //         definedVariables.includes(node);
    //         if (!symbol) {
    //             undefinedVariables.push(node.getText());
    //         }
    //     }

    //     if (ts.isImportDeclaration(node)) {
    //         const importDeclaration = node as ts.ImportDeclaration;
    //         throw new ServiceError(400, `Cant use an import declaration ${importDeclaration.getText()}`);
    //     }

    //     ts.forEachChild(node, (childNode) => {
    //         const newVariablesOfChild = visit(childNode, definedVariables);
    //         newVariables.push(newVariablesOfChild);
    //     });

    //     return undefined;
    // }

    // if (undefinedVariables.length > 0) {
    //     throw new ServiceError(400, `cant use undefined variables or functions ${undefinedVariables.map((undefinedVar) => undefinedVar)}`);
    // }

    // nameOfFunctionMustBe.forEach((functionName) => {
    //     const numOfOccurrences = countNumOfOccurrences[functionName];
    //     if (!numOfOccurrences || numOfOccurrences !== 1) {
    //         throw new ServiceError(400, `problem in function: ${functionName}`);
    //     }
    // });

    // eslint-disable-next-line dot-notation
    req['actions'] = cleanActionCode(actions, entityTemplate);
};
