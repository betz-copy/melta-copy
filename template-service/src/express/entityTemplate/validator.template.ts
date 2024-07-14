import { Request } from 'express';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import EntityTemplateManager from './manager';
import { IEntityTemplatePopulated } from './interface';
import { generateInterface } from '../../utils/generateInterfaceFromEntityTemplateProperties';
import { ServiceError } from '../error';

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

function traverse(
    node: ts.Node,
    parentScope: Set<string>,
    errors: string[],
    nameOfFunctionMustBe: string[],
    countNumOfOccurrences: Record<string, number>,
) {
    const currentScope = new Set(parentScope);

    if (ts.isImportDeclaration(node)) {
        const importDeclaration = node as ts.ImportDeclaration;
        throw new ServiceError(400, `Cant use an import declaration ${importDeclaration.getText()}`);
    }

    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
        currentScope.add(node.name.text);
    } else if (ts.isFunctionDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
        currentScope.add(node.name.text);
        node.parameters.forEach((param) => {
            if (ts.isIdentifier(param.name)) {
                currentScope.add(param.name.text);
            }
        });
    } else if (ts.isBlock(node)) {
        node.statements.forEach((statement) => {
            if (ts.isVariableStatement(statement)) {
                statement.declarationList.declarations.forEach((decl) => {
                    if (ts.isIdentifier(decl.name)) {
                        currentScope.add(decl.name.text);
                    }
                });
            }
        });
    } else if (ts.isInterfaceDeclaration(node)) {
        currentScope.add(node.name.text);

        node.members.forEach((member) => {
            if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
                currentScope.add(member.name.text);
            }
        });
    } else if (ts.isTypeReferenceNode(node) && node.getText().includes('Record')) {
        currentScope.add('Record');
    }

    if (ts.isIdentifier(node) && !currentScope.has(node.text)) {
        errors.push(`Error: Undeclared variable '${node.text}' at position ${node.pos}`);
    }

    if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
        const functionName = node.name?.getText();
        if (functionName && nameOfFunctionMustBe.includes(functionName)) {
            // eslint-disable-next-line no-param-reassign
            countNumOfOccurrences[functionName] = (countNumOfOccurrences[functionName] || 0) + 1;
        }
    }

    ts.forEachChild(node, (child) => {
        traverse(child, currentScope, errors, nameOfFunctionMustBe, countNumOfOccurrences);
    });
}

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

    const errors: string[] = [];
    const countNumOfOccurrences: Record<string, number> = {};
    const nameOfFunctionMustBe = ['onCreateEntity', 'onUpdateEntity', 'onDeleteEntity'];

    traverse(sourceFile, new Set<string>(), errors, nameOfFunctionMustBe, countNumOfOccurrences);

    if (errors.length > 0) {
        errors.forEach((error) => console.log({ error }));
    } else {
        console.log('No undeclared variables found.');
    }

    // eslint-disable-next-line dot-notation
    req['actions'] = cleanActionCode(actions, entityTemplate);
};
