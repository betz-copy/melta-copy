import { Request } from 'express';
import * as ts from 'typescript-code';
import EntityTemplateManager from './manager';
import { IEntityTemplate } from './interface';
import { generateInterface } from '../../utils/generateInterfaceFromEntityTemplateProperties';

const cleanActionCode = (action: string, entityTemplate: IEntityTemplate) => {
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
    const sourceCode = `
function testFunction(a: number, b: number) {
    let x = a + b;
    let y = z + 1; // z is not defined
    return x + y;
}`;

    const sourceFile = ts.createSourceFile(filename, sourceCode, ts.ScriptTarget.ES5);

    const defaultCompilerHost = ts.createCompilerHost({});

    const customCompilerHost: ts.CompilerHost = {
        getSourceFile: (name, languageVersion) => {
            console.log(`getSourceFile ${name}`);

            if (name === filename) {
                return sourceFile;
            }
            return defaultCompilerHost.getSourceFile(name, languageVersion);
        },
        writeFile: (_filename, _data) => {},
        getDefaultLibFileName: () => 'lib.d.ts',
        useCaseSensitiveFileNames: () => false,
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => '',
        getNewLine: () => '\n',
        getDirectories: () => [],
        fileExists: () => true,
        readFile: () => '',
    };

    const program = ts.createProgram(['test.ts'], {}, customCompilerHost);

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
