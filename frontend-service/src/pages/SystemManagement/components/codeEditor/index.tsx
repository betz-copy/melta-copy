import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton } from '@mui/material';
import React, { useState } from 'react';
import i18next from 'i18next';
import { CloseOutlined, Done } from '@mui/icons-material';
import { editor } from 'monaco-editor';
import { AST, TSESTreeOptions, parse, parseAndGenerateServices } from '@typescript-eslint/typescript-estree';
// import os from 'os';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { ActionManagement } from '../../../../common/wizards/codeEditor/actionsManagement';
import * as ts from 'typescript';
import { useMutation } from 'react-query';
import { AxiosError } from 'axios';
import { ErrorToast } from '../../../../common/ErrorToast';
import { toast } from 'react-toastify';
import { updateActionToEntity } from '../../../../services/templates/enitityTemplatesService';

const options: TSESTreeOptions = {
    comment: true,
    tokens: true,
    loc: true,
    range: true,
    errorOnUnknownASTType: true,
    errorOnTypeScriptSyntacticAndSemanticIssues: true,
    jsx: true,
};

const CodeEditorDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    entityTemplate: IMongoEntityTemplatePopulated | null;
}> = ({ open, handleClose, entityTemplate }) => {
    const [ast, setAst] = useState<ts.SourceFile>(entityTemplate?.actions?.codeAST);

    const { mutateAsync, isLoading } = useMutation(
        () => {
            return updateActionToEntity(entityTemplate?._id!, ast!.text, ast!);
        },
        {
            onError: (err: AxiosError) => {
                toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('execActionWithRuleBreach.failedToCreateRequest')} />);
            },
            onSuccess: () => {
                toast.success(i18next.t('execActionWithRuleBreach.succeededToCreateRequest'));
                handleClose();
            },
        },
    );

    const traverseAstAndValidate = (node: ts.Node) => {
        if (ts.isFunctionDeclaration(node)) {
            console.log('Found function declaration:', node.name?.getText());
        }
        ts.forEachChild(node, traverseAstAndValidate);
    };

    const onChange = (value: string | undefined, _event: editor.IModelContentChangedEvent) => {
        const sourceFile = ts.createSourceFile('temp.tsx', value!, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        console.log(sourceFile.statements);
        console.log(sourceFile.text);
        setAst(sourceFile);

        traverseAstAndValidate(sourceFile);
        const c = 'let x = 5 ; x += 2;';
        // const astCode: AST<typeof options> = parse(c!);
        // console.log(parse(c));
        // console.log(parseAndGenerateServices(c, options));

        // console.log(astCode);
        // console.log(parse(value));
        console.log(value);
    };

    const saveAction = async () => {
        await mutateAsync();
    };

    return (
        <Dialog
            open={open}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { bgcolor: 'white' } }}
            style={{ height: '80%', margin: 'auto' }}
            disableEnforceFocus
        >
            <DialogTitle color={(theme) => theme.palette.primary.main} fontSize="20px" fontWeight="600" fontFamily="Rubik">
                {i18next.t('actions.addActions')}
                <IconButton
                    aria-label="close"
                    onClick={async () => {
                        handleClose();
                    }}
                    sx={{
                        position: 'absolute',
                        right: 12,
                        top: 12,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseOutlined />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <ActionManagement entityTemplate={entityTemplate} onChange={onChange} />
            </DialogContent>
            <DialogActions>
                <Grid item>
                    <Button type="submit" variant="contained" disabled={isLoading} sx={{ borderRadius: '10px' }} onClick={saveAction}>
                        {i18next.t('wizard.finish')}
                        {isLoading && <CircularProgress size={20} />}
                        <Done />
                    </Button>
                </Grid>
            </DialogActions>
        </Dialog>
    );
};

export { CodeEditorDialog };
