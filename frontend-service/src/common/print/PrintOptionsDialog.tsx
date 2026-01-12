import { CloseOutlined } from '@mui/icons-material';
import { Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, useTheme } from '@mui/material';
import { IEntity, IEntityExpanded } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IFile } from '@packages/preview';
import {
    IMongoProcessInstanceReviewerPopulated,
    IMongoProcessTemplateReviewerPopulated,
    IMongoStepTemplatePopulated,
    InstanceProperties,
} from '@packages/process';
import i18next from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import RelationshipSelection from '../../pages/Entity/components/print/RelationshipSelection';
import { getFile } from '../../utils/getFileType';
import BlueTitle from '../MeltaDesigns/BlueTitle';
import DialogFooter from './components/DialogFooter';
import PrintSettings from './components/PrintSettings';

type IOption = {
    show: boolean;
    set: React.Dispatch<React.SetStateAction<boolean>>;
    label: string;
};

export interface IPrintOptions {
    isShowDisabled: boolean;
    showEntitiesDates: boolean;
    showPreviewPropertiesOnly: boolean;
    addEntityCheckbox?: boolean;
    appendSignatureField?: boolean;
}

export enum PrintType {
    Entity = 'entity',
    Process = 'process',
}
export interface IEntityPrint {
    type: PrintType.Entity;
    template: IMongoEntityTemplateWithConstraintsPopulated;
    instance: IEntityExpanded;
    options: { [K in keyof Pick<IPrintOptions, 'appendSignatureField' | 'isShowDisabled' | 'showPreviewPropertiesOnly'>]: IOption };
}

interface IProcessPrint {
    type: PrintType.Process;
    template: IMongoProcessTemplateReviewerPopulated;
    instance: IMongoProcessInstanceReviewerPopulated;
    options: { processSummary: IOption };
}

export type PrintItem = IEntityPrint | IProcessPrint;

const getFilesFromTemplate = (
    instanceProps: IEntity['properties'] | InstanceProperties,
    templateProps: IMongoEntityTemplateWithConstraintsPopulated | IMongoProcessTemplateReviewerPopulated['details'] | IMongoStepTemplatePopulated,
): IFile[] => {
    return Object.keys(templateProps.properties.properties).flatMap((propertyKey) => {
        const propertySchema = templateProps.properties.properties[propertyKey];
        const propertyValue = instanceProps[propertyKey];

        if (propertyValue) {
            if (propertySchema.format === 'fileId') return [getFile(propertyValue)];
            if (propertySchema.type === 'array' && propertySchema.items?.format === 'fileId') return propertyValue.map((id: string) => getFile(id));
        }
        return [];
    });
};
const PrintOptionsDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    printItem: PrintItem;
    files: IFile[];
    setFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    selectedFiles: (IFile & { isLoading: boolean })[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<(IFile & { isLoading: boolean })[]>>;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    title: string | undefined;
    setTitle: React.Dispatch<React.SetStateAction<string | undefined>>;
    setSelectedRelationShipIds?: React.Dispatch<React.SetStateAction<string[]>>;
    selectedPrintingTemplate?: IMongoPrintingTemplate;
    setSelectedPrintingTemplate?: React.Dispatch<React.SetStateAction<IMongoPrintingTemplate | undefined>>;
    isPrintEntities?: boolean;
}> = ({
    open,
    handleClose,
    printItem,
    files,
    setFiles,
    selectedFiles,
    setSelectedFiles,
    onClick,
    title,
    setTitle,
    setSelectedRelationShipIds,
    selectedPrintingTemplate,
    setSelectedPrintingTemplate,
    isPrintEntities,
}) => {
    const theme = useTheme();
    const { type, template, instance } = printItem;

    const [selectedEntitiesCount, setSelectedEntitiesCount] = useState<number>(0);

    const getPropertiesFiles = useCallback((): IFile[] => {
        if (type === PrintType.Entity) return getFilesFromTemplate(instance.entity.properties, template);
        return getFilesFromTemplate(instance.details, template.details);
    }, [template, instance, type]);

    const getProcessStepsFiles = useCallback((): IFile[] => {
        if (type === PrintType.Entity) return [];
        return template.steps.flatMap((stepTemplate) => instance.steps.flatMap((step) => getFilesFromTemplate(step.properties ?? {}, stepTemplate)));
    }, [instance, template, type]);

    useEffect(() => {
        const filterFiles = ({ contentType }: IFile) => contentType !== 'video' && contentType !== 'audio' && contentType !== 'unsupported';
        const currFiles = getPropertiesFiles().filter(filterFiles).concat(getProcessStepsFiles().filter(filterFiles));

        setFiles(currFiles);
        setSelectedFiles([]);
    }, [getPropertiesFiles, getProcessStepsFiles, setFiles, setSelectedFiles]);

    const queryClient = useQueryClient();
    const { maxEntitiesToPrint } = queryClient.getQueryData<BackendConfigState>('getBackendConfig')!;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            onClick={(e) => e.stopPropagation()}
            PaperProps={{
                sx: {
                    width: '51rem',
                    maxWidth: '51rem',
                    height: '32rem',
                    maxHeight: '32rem',
                },
            }}
        >
            <DialogTitle>
                <Grid container display="flex" justifyContent="space-between" alignItems="center">
                    <Grid>
                        <BlueTitle title={i18next.t('entityPage.print.printOptions')} component="h6" variant="h6" />
                    </Grid>
                    <Grid>
                        <IconButton onClick={handleClose}>
                            <CloseOutlined sx={{ color: theme.palette.primary.main }} />
                        </IconButton>
                    </Grid>
                </Grid>
            </DialogTitle>

            <DialogContent>
                <Grid sx={{ display: 'flex', flexDirection: 'row' }}>
                    {type === PrintType.Entity && setSelectedRelationShipIds && (
                        <Box width={'55%'} paddingRight={5.5}>
                            <Box bgcolor="#EBEFFA" borderRadius={'5px'} marginBottom={2} padding="5px">
                                <Typography fontSize={'14px'} marginLeft={'1rem'} color="#1E2775">
                                    {i18next.t('entityPage.print.relationshipsToDisplay')}
                                </Typography>
                            </Box>
                            <RelationshipSelection
                                setSelectedEntitiesCount={setSelectedEntitiesCount}
                                expandedEntity={instance}
                                setSelectedRelationShipIds={setSelectedRelationShipIds}
                            />
                        </Box>
                    )}
                    <Grid width={'45%'}>
                        <PrintSettings
                            isPrintEntities={isPrintEntities || false}
                            title={title || ''}
                            setTitle={setTitle}
                            selectedPrintingTemplate={selectedPrintingTemplate}
                            setSelectedPrintingTemplate={setSelectedPrintingTemplate}
                            files={files}
                            selectedFiles={selectedFiles}
                            setSelectedFiles={setSelectedFiles}
                            printItem={printItem}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <DialogFooter
                    handleClose={handleClose}
                    selectedEntitiesCount={selectedEntitiesCount}
                    maxEntitiesToPrint={maxEntitiesToPrint}
                    onClick={onClick}
                    isPrintEntities={isPrintEntities}
                />
            </DialogActions>
        </Dialog>
    );
};

export default PrintOptionsDialog;
