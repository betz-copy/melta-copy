import * as ts from 'typescript-actions';

const isFunctionExists = (node: ts.Node, functionName: 'onCreateEntity' | 'onUpdateEntity'): node is ts.FunctionDeclaration => {
    return ts.isFunctionDeclaration(node) && node.name?.text === functionName;
};

const isFunctionBodyNonEmpty = (func: ts.FunctionDeclaration): boolean => {
    return !!func.body && func.body.statements.some((statement) => statement.getText().trim().length > 0);
};

const findFunctionDeclaration = (
    sourceFile: ts.SourceFile,
    functionName: 'onCreateEntity' | 'onUpdateEntity',
): ts.FunctionDeclaration | undefined => {
    let foundFunction: ts.FunctionDeclaration | undefined;

    const visit = (node: ts.Node) => {
        if (isFunctionExists(node, functionName)) {
            foundFunction = node;
        } else {
            ts.forEachChild(node, visit);
        }
    };

    visit(sourceFile);

    return foundFunction;
};

export const isBodyFunctionHasContent = (code: string, functionName: 'onCreateEntity' | 'onUpdateEntity'): boolean => {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);

    const functionDeclaration = findFunctionDeclaration(sourceFile, functionName);
    return functionDeclaration ? isFunctionBodyNonEmpty(functionDeclaration) : false;
};
