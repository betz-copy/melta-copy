import * as ts from 'typescript';

export const isBodyFunctionHasContent = (code: string, functionName: 'onCreateEntity' | 'onUpdateEntity' | 'onDeleteEntity') => {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);

    function isFunctionExists(node: ts.Node, name: string): node is ts.FunctionDeclaration {
        return ts.isFunctionDeclaration(node) && node.name?.text === name;
    }

    function hasNonEmptyBody(func: ts.FunctionDeclaration): boolean {
        if (!func.body) return false;

        for (const statement of func.body.statements) {
            const statementText = statement.getText().trim();
            if (statementText.length > 0) {
                return true;
            }
        }

        return false;
    }

    let functionFound = false;

    function visit(node: ts.Node) {
        if (isFunctionExists(node, functionName)) {
            functionFound = hasNonEmptyBody(node);
            return;
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return functionFound;
};
