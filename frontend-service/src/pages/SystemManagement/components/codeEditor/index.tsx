import { CloseOutlined, ContentCopy, Done } from '@mui/icons-material';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Typography } from '@mui/material';
import { IMongoCategory } from '@packages/category';
import { EntityTemplateType, IMongoChildTemplateWithConstraintsPopulated, TemplateItem } from '@packages/child-template';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import { editor } from 'monaco-editor';
import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import * as ts from 'typescript-actions';
import { AreYouSureDialog } from '../../../../common/dialogs/AreYouSureDialog';
import { ErrorToast } from '../../../../common/ErrorToast';
import IconButtonWithPopover from '../../../../common/IconButtonWithPopover';
import { environment } from '../../../../globals';
import { IChildTemplateMap, IEntityTemplateMap } from '../../../../interfaces/template';
import { updateActionToEntity } from '../../../../services/templates/entityTemplatesService';
import { getChildPropertiesFiltered } from '../../../../utils/childTemplates';
import { generateBasicFunctions } from '../../../../utils/templateActions/generateFunctions';
import { generateInterfaceWithRelationships } from '../../../../utils/templateActions/interfaceGenerator';
import { ActionManagement } from './actionsManagement';

const { noTypeGivenErrorCodeTs, unusedPropertyErrorCodeTs } = environment.systemManagement.actions;

const CodeEditorDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    templateItem: TemplateItem;
    searchText: string;
    categoriesToShow: IMongoCategory[];
    isChild?: boolean;
}> = ({ open, handleClose, templateItem, searchText, categoriesToShow }) => {
    const { type, metaData: entityTemplate } = templateItem;

    const queryClient = useQueryClient();

    const [validationErrors, setValidationErrors] = useState(false);
    const [isImportUsing, setIsImportUsing] = useState(false);
    const [editorValue, setEditorValue] = useState('');
    const [closeActionDialog, setCloseActionDialog] = useState(false);

    const hasActions = !!entityTemplate.actions;
    const defaultCode = [
        '/// To throw a custom error in your code, use the following syntax:',
        '// throw new CustomError("Your error message")',
        '',
        `${generateInterfaceWithRelationships(
            type === EntityTemplateType.Parent ? entityTemplate.properties.properties : getChildPropertiesFiltered(entityTemplate),
            entityTemplate.name,
            queryClient,
            type === EntityTemplateType.Child ? entityTemplate.parentTemplate : undefined,
        )}`,
        '',
        'function updateEntity(entityId: string, properties: Record<string, any>): void {',
        '  // updates entity in data base',
        '}',
    ].join('\n');

    const defaultValue = [
        defaultCode,
        '',
        generateBasicFunctions(['onCreateEntity', 'onUpdateEntity'], `${entityTemplate.name}${type === EntityTemplateType.Child ? 'Merged' : ''}`),
    ].join('\n');

    const isEditorChanged = useMemo(
        () => (hasActions ? editorValue !== `${defaultCode}\n${entityTemplate.actions}\n` : editorValue !== defaultValue),
        [editorValue, hasActions, defaultCode, defaultValue, entityTemplate.actions],
    );

    const { mutateAsync, isLoading } = useMutation(() => updateActionToEntity(entityTemplate._id, editorValue, type === EntityTemplateType.Child), {
        onError: (err: AxiosError) => {
            toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('systemManagement.entityAction.failedUpdateAction')} />);
        },
        onSuccess: (data) => {
            const { actions } = data;
            if (type === EntityTemplateType.Parent)
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) =>
                    entityTemplateMap!.set(entityTemplate._id, { ...entityTemplate, actions } as IMongoEntityTemplateWithConstraintsPopulated),
                );
            else
                queryClient.setQueryData<IChildTemplateMap>('getChildTemplates', (childTemplateMap) =>
                    childTemplateMap!.set(entityTemplate._id, { ...entityTemplate, actions } as IMongoChildTemplateWithConstraintsPopulated),
                );

            queryClient.invalidateQueries(['searchEntityTemplates', searchText, categoriesToShow]);
            toast.success(i18next.t('systemManagement.entityAction.successUpdateAction'));
            handleClose();
        },
    });

    const traverseAstAndValidate = (node: ts.Node): boolean => {
        let foundImports = false;

        const traverseAstRecursive = (nodeAst: ts.Node) => {
            if (ts.isImportDeclaration(nodeAst)) foundImports = true;

            ts.forEachChild(nodeAst, traverseAstRecursive);
        };

        traverseAstRecursive(node);

        return foundImports;
    };

    const onChange = (value: string | undefined, _event: editor.IModelContentChangedEvent) => {
        setEditorValue(value ?? '');
        const sourceFile = ts.createSourceFile('codeAst.tsx', value ?? '', ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        const hasImport = traverseAstAndValidate(sourceFile);
        setIsImportUsing(hasImport);
    };

    const onValidate = (markers: editor.IMarker[]) => {
        const filteredMarkers = markers.filter((marker) => marker.code !== unusedPropertyErrorCodeTs && marker.code !== noTypeGivenErrorCodeTs);
        const hasErrorMarkers = filteredMarkers.length > 0;

        setValidationErrors(hasErrorMarkers);
    };

    const saveAction = () => mutateAsync();

    return (
        <Box>
            <Dialog open={open} maxWidth="md" fullWidth disableEnforceFocus>
                <DialogTitle>
                    <Grid display="flex" flexDirection="row" alignItems="center" gap=".25rem">
                        <Typography color="primary" fontSize="20px" fontWeight="600" fontFamily="Rubik">
                            {i18next.t('actions.addActions')} - {entityTemplate.displayName}
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
                            <ContentCopy color="primary" />
                        </IconButtonWithPopover>
                    </Grid>
                    <IconButton
                        aria-label="close"
                        onClick={() => {
                            if (isEditorChanged) setCloseActionDialog(true);
                            else handleClose();
                        }}
                        sx={{ position: 'absolute', right: 12, top: 12 }}
                    >
                        <CloseOutlined color="primary" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <ActionManagement
                        onChange={onChange}
                        onValidate={onValidate}
                        forbidden={isImportUsing}
                        value={entityTemplate.actions ? `${defaultCode}\n${entityTemplate.actions}\n` : undefined}
                        setEditorContent={setEditorValue}
                        defaultValue={defaultValue}
                    />
                </DialogContent>
                <DialogActions sx={{ padding: '16px' }}>
                    <Grid>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading || validationErrors || isImportUsing || !isEditorChanged}
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
            <AreYouSureDialog
                open={closeActionDialog}
                handleClose={() => setCloseActionDialog(false)}
                onYes={handleClose}
                isLoading={isLoading}
                body={i18next.t('systemManagement.entityAction.theCodeWillBeDeletedOnClose')}
            />
        </Box>
    );
};

export { CodeEditorDialog };
