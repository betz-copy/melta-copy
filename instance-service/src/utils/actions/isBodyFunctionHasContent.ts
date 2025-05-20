import * as ts from 'typescript-actions';
import { IEntityCrudAction } from '../../express/entities/interface';

const isFunctionExists = (node: ts.Node, functionName: IEntityCrudAction): node is ts.FunctionDeclaration =>
    ts.isFunctionDeclaration(node) && node.name?.text === functionName;

const isFunctionBodyNonEmpty = (func: ts.FunctionDeclaration): boolean =>
    func.body?.statements.some((statement) => statement.getText().trim().length > 0) ?? false;

const findFunctionDeclaration = (sourceFile: ts.SourceFile, functionName: IEntityCrudAction): ts.FunctionDeclaration | undefined => {
    let foundFunction: ts.FunctionDeclaration | undefined;

    const visit = (node: ts.Node) => {
        if (isFunctionExists(node, functionName)) foundFunction = node;
        else ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return foundFunction;
};

const isBodyFunctionHasContent = (code: string, functionName: IEntityCrudAction): boolean => {
    const sourceFile = ts.createSourceFile('codeAst.ts', code, ts.ScriptTarget.Latest, true);

    const functionDeclaration = findFunctionDeclaration(sourceFile, functionName);
    return functionDeclaration ? isFunctionBodyNonEmpty(functionDeclaration) : false;
};

export default isBodyFunctionHasContent;
