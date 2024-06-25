import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Typography } from '@mui/material';
import React, { useState } from 'react';
import i18next from 'i18next';
import { CloseOutlined, Done, ContentCopy } from '@mui/icons-material';
import { editor } from 'monaco-editor';
import { AST, TSESTreeOptions, parse, parseAndGenerateServices } from '@typescript-eslint/typescript-estree';
// import os from 'os';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { ActionManagement } from '../../../../common/wizards/codeEditor/actionsManagement';
import * as ts from 'typescript';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { ErrorToast } from '../../../../common/ErrorToast';
import { toast } from 'react-toastify';
import { updateActionToEntity } from '../../../../services/templates/enitityTemplatesService';
import IconButtonWithPopover from '../../../../common/IconButtonWithPopover';

const options: TSESTreeOptions = {
    comment: true,
    tokens: true,
    loc: true,
    range: true,
    errorOnUnknownASTType: true,
    errorOnTypeScriptSyntacticAndSemanticIssues: true,
    jsx: true,
};

const CodeEditorDialog: React.FC<{ open: boolean; handleClose: () => void; entityTemplate: IMongoEntityTemplatePopulated | null }> = ({
    open,
    handleClose,
    entityTemplate,
}) => {
    const queryClient = useQueryClient();

    if (!entityTemplate) return <></>;

    const [code, setcode] = useState(entityTemplate.actions);
    const [errors, setErrors] = useState(false);
    const [importUsing, setImportUsing] = useState(false);

    const { mutateAsync, isLoading } = useMutation(
        () => {
            return updateActionToEntity(entityTemplate._id!, code!);
        },
        {
            onError: (err: AxiosError) => {
                toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('systemManagement.entityAction.failedUpdateAction')} />);
            },
            onSuccess: () => {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) =>
                    entityTemplateMap!.set(entityTemplate._id, { ...entityTemplate, actions: code }),
                );
                toast.success(i18next.t('systemManagement.entityAction.successUpdateAction'));
                handleClose();
            },
        },
    );
    const traverseAstAndValidate = (node: ts.Node) => {
        const nameOfFunctionMustBe = ['onCreateEntity', 'onUpdateEntity', 'onDeleteEntity'];
        const countNumOfOccurrences: Record<string, number> = {};

        const traverseAstRecursive = (node: ts.Node) => {
            if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
                const functionName = node.name?.getText();
                if (functionName && nameOfFunctionMustBe.includes(functionName)) {
                    countNumOfOccurrences[functionName] = (countNumOfOccurrences[functionName] || 0) + 1;
                }
            }

            if (ts.isImportDeclaration(node)) {
                setImportUsing(true);
                console.log("mustn't import!!");
            }

            ts.forEachChild(node, traverseAstRecursive);
        };

        traverseAstRecursive(node);

        nameOfFunctionMustBe.forEach((functionName) => {
            const numOfOccurrences = countNumOfOccurrences[functionName];
            if (!numOfOccurrences || numOfOccurrences !== 1) setImportUsing(true);
        });
    };

    const onChange = (value: string | undefined, _event: editor.IModelContentChangedEvent) => {
        setcode(value!);
    };

    const onValidate = (markers: editor.IMarker[]) => {
        const UndefinedVariableErrorCode = '2304';
        // const importErrorCode = '2792';
        const hasErrorMarkers = markers.some((marker) => marker.code === UndefinedVariableErrorCode);
        setErrors(hasErrorMarkers);
    };

    const saveAction = async () => {
        const sourceFile = ts.createSourceFile('temp.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        traverseAstAndValidate(sourceFile);
        await mutateAsync();
    };

    const mainColor = (theme) => theme.palette.primary.main;

    return (
        <Dialog open={open} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: 'white' } }} disableEnforceFocus>
            <DialogTitle>
                <Grid display="flex" flexDirection="row" alignItems="center" gap=".25rem">
                    <Typography color={mainColor} fontSize="20px" fontWeight="600" fontFamily="Rubik">
                        {i18next.t('actions.addActions')}
                    </Typography>
                    <IconButtonWithPopover
                        popoverText={i18next.t('systemManagement.entityAction.copyCode')}
                        iconButtonProps={{
                            onClick: () => {
                                navigator.clipboard.writeText(code);
                                toast.success(i18next.t('systemManagement.entityAction.successCopyCode'));
                            },
                        }}
                    >
                        <ContentCopy sx={{ color: mainColor }} />
                    </IconButtonWithPopover>
                </Grid>
                <IconButton
                    aria-label="close"
                    onClick={async () => {
                        handleClose();
                    }}
                    sx={{
                        position: 'absolute',
                        right: 12,
                        top: 12,
                        color: mainColor,
                    }}
                >
                    <CloseOutlined />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <ActionManagement
                    entityTemplate={entityTemplate}
                    onChange={onChange}
                    onValidate={onValidate}
                    forbidden={importUsing}
                    value={entityTemplate.actions}
                />
            </DialogContent>
            <DialogActions>
                <Grid item>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading || errors || importUsing}
                        sx={{ borderRadius: '10px' }}
                        onClick={saveAction}
                    >
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
// function onCreateEntity(travelAgent: travelAgent): { updated_travelAgent?: travelAgent; } {
//     const updated_travelAgent = { ...travelAgent, age: travelAgent.age }
//     return {
//         updated_travelAgent: {
//             ...travelAgent, age: travelAgent.age
//         }
//     }
// }
// function onCreateEntity(travelAgent: travelAgent): { updated_travelAgent?: travelAgent } {
//     const updated_travelAgent: travelAgent = {
//         ...travelAgent,
//         age: travelAgent.age,
//     };
//     return { updated_travelAgent };
// }
// function onUpdateEntity(travelAgent: travelAgent): { updated_travelAgent?: travelAgent } {
//     return {};
// }

// function onDeleteEntity(travelAgent: travelAgent): { updated_travelAgent?: travelAgent } {
//     return {};
// }
