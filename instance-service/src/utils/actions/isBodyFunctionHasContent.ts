import * as ts from 'typescript-actions';

export const isBodyFunctionHasContent = (code: string, functionName: 'onCreateEntity' | 'onUpdateEntity' | 'onDeleteEntity'): boolean => {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);

    const isFunctionExists = (node: ts.Node, name: string): node is ts.FunctionDeclaration =>
        ts.isFunctionDeclaration(node) && node.name?.text === name;

    const hasNonEmptyBody = (func: ts.FunctionDeclaration): boolean =>
        !!func.body && func.body.statements.some((statement) => statement.getText().trim().length > 0);

    let functionFound = false;

    const visit = (node: ts.Node) => {
        if (isFunctionExists(node, functionName)) {
            functionFound = hasNonEmptyBody(node);
        } else {
            ts.forEachChild(node, visit);
        }
    };

    visit(sourceFile);
    return functionFound;
};
