import { Request } from 'express';
import * as ts from 'typescript';
import { ServiceError } from '../error';

export const validateActionAst = async (req: Request) => {
    const { actions } = req.body;
    const fileName = 'ast.ts';

    const sourceFile = ts.createSourceFile(fileName, actions, ts.ScriptTarget.Latest);

    const defaultCompilerHost = ts.createCompilerHost({});

    const customCompilerHost: ts.CompilerHost = {
        getSourceFile: (name, languageVersion) => {
            if (name === fileName) {
                return sourceFile;
            }
            return defaultCompilerHost.getSourceFile(name, languageVersion);
        },
        writeFile: (_filename, _data) => {},
        getDefaultLibFileName: () => 'lib.d.ts',
        useCaseSensitiveFileNames: () => false,
        getCanonicalFileName: (filename) => filename,
        getCurrentDirectory: () => '',
        getNewLine: () => '\n',
        getDirectories: () => [],
        fileExists: () => true,
        readFile: () => '',
    };

    const program = ts.createProgram([fileName], {}, customCompilerHost);

    const checker = program.getTypeChecker();
    const undefinedVariables: string[] = [];
    const nameOfFunctionMustBe = ['onCreateEntity', 'onUpdateEntity', 'onDeleteEntity'];
    const countNumOfOccurrences: Record<string, number> = {};

    function visit(node: ts.Node) {
        if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
            const functionName = node.name?.getText();
            if (functionName && nameOfFunctionMustBe.includes(functionName)) {
                countNumOfOccurrences[functionName] = (countNumOfOccurrences[functionName] || 0) + 1;
            }
        }

        if (ts.isIdentifier(node)) {
            const symbol = checker.getSymbolAtLocation(node);
            if (!symbol) {
                undefinedVariables.push(node.getText());
            }
        }

        if (ts.isImportDeclaration(node)) {
            const importDeclaration = node as ts.ImportDeclaration;
            throw new ServiceError(400, `Cant use an import declaration ${importDeclaration.getText()}`);
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    if (undefinedVariables)
        throw new ServiceError(400, `cant use undefined variables or functions ${undefinedVariables.map((undefinedVar) => undefinedVar)}`);

    nameOfFunctionMustBe.forEach((functionName) => {
        const numOfOccurrences = countNumOfOccurrences[functionName];
        if (!numOfOccurrences || numOfOccurrences !== 1) throw new ServiceError(400, `problem in function: ${functionName}`);
    });
};
