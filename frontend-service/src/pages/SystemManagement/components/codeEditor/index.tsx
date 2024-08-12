import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Typography } from '@mui/material';
import React, { useState } from 'react';
import i18next from 'i18next';
import { CloseOutlined, Done, ContentCopy } from '@mui/icons-material';
import { editor } from 'monaco-editor';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { ActionManagement } from './actionsManagement';
import * as ts from 'typescript';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { ErrorToast } from '../../../../common/ErrorToast';
import { toast } from 'react-toastify';
import { updateActionToEntity } from '../../../../services/templates/enitityTemplatesService';
import IconButtonWithPopover from '../../../../common/IconButtonWithPopover';
import { generateInterfaceWithRelationships } from '../../../../utils/jsonSchemToInterface-ts';

const CodeEditorDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    entityTemplate: IMongoEntityTemplatePopulated | null;
}> = ({ open, handleClose, entityTemplate }) => {
    if (!entityTemplate) return null;

    const queryClient = useQueryClient();

    const [validationErrors, setValidationErrors] = useState(false);
    const [isImportUsing, setIsImportUsing] = useState(false);
    const [editorValue, setEditorValue] = useState('');

    const defaultCode = [
        `${generateInterfaceWithRelationships(entityTemplate.properties.properties, entityTemplate.name)}`,
        '',
        'function updateEntity(entityId: string, properties: Record<string, any>): void {',
        '  // updates entity in data base',
        '}',
    ].join('\n');

    const { mutateAsync, isLoading } = useMutation(
        () => {
            return updateActionToEntity(entityTemplate._id, editorValue);
        },
        {
            onError: (err: AxiosError) => {
                toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('systemManagement.entityAction.failedUpdateAction')} />);
            },
            onSuccess: (data) => {
                const { actions } = data;

                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) =>
                    entityTemplateMap!.set(entityTemplate._id, { ...entityTemplate, actions }),
                );
                toast.success(i18next.t('systemManagement.entityAction.successUpdateAction'));
                handleClose();
            },
        },
    );

    const traverseAstAndValidate = (node: ts.Node) => {
        let foundImports = false;

        const traverseAstRecursive = (node: ts.Node) => {
            if (ts.isImportDeclaration(node)) {
                foundImports = true;
            }
            ts.forEachChild(node, traverseAstRecursive);
        };

        traverseAstRecursive(node);

        return foundImports;
    };

    const onChange = (value: string | undefined, _event: editor.IModelContentChangedEvent) => {
        setEditorValue(value ?? '');
        const sourceFile = ts.createSourceFile('temp.tsx', value ?? '', ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        const isImportUsing = traverseAstAndValidate(sourceFile);
        setIsImportUsing(isImportUsing);
    };

    const onValidate = (markers: editor.IMarker[]) => {
        const unusedPropertyErrorCode = '6133';
        const marker = markers.filter((marker) => marker.code !== unusedPropertyErrorCode);
        const hasErrorMarkers = marker.length > 0;

        setValidationErrors(hasErrorMarkers);
    };

    const saveAction = async () => {
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
                                navigator.clipboard.writeText(editorValue);
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
                    forbidden={isImportUsing}
                    value={entityTemplate.actions ? `${defaultCode}\n${entityTemplate.actions}\n` : undefined}
                    setEditorContent={setEditorValue}
                />
            </DialogContent>
            <DialogActions>
                <Grid item>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading || validationErrors || isImportUsing}
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
