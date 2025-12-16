import {
    IEntity,
    IEntityExpanded,
    IMongoEntityTemplateWithConstraintsPopulated,
    IMongoProcessInstanceReviewerPopulated,
    IMongoProcessTemplateReviewerPopulated,
    IMongoStepTemplatePopulated,
    InstanceProperties,
} from '@microservices/shared';
import { CloseOutlined, PrintOutlined } from '@mui/icons-material';
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    IconButton,
    TextField,
    useTheme,
} from '@mui/material';
import i18next from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { IFile } from '../../interfaces/preview';
import RelationshipSelection, { EntityConnectionsProps } from '../../pages/Entity/components/print/RelationshipSelection';
import { getFile } from '../../utils/getFileType';
import MultipleSelect from '../inputs/MultipleSelect';
import BlueTitle from '../MeltaDesigns/BlueTitle';
import MeltaSwitch from '../MeltaDesigns/MeltaSwitch';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';

type IOption = {
    show: boolean;
    set: React.Dispatch<React.SetStateAction<boolean>>;
    label: string;
};

export enum PrintType {
    Entity = 'entity',
    Process = 'process',
}
interface IEntityPrint {
    type: PrintType.Entity;
    template: IMongoEntityTemplateWithConstraintsPopulated;
    instance: IEntityExpanded;
    entityConnections: EntityConnectionsProps;
    options: {
        disabled: IOption;
        entityDates: IOption;
        previewPropertiesOnly: IOption;
    };
}

interface IProcessPrint {
    type: PrintType.Process;
    template: IMongoProcessTemplateReviewerPopulated;
    instance: IMongoProcessInstanceReviewerPopulated;
    options: { processSummary: IOption };
}

type PrintItem = IEntityPrint | IProcessPrint;

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
    selectedFiles: IFile[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    filesLoadingStatus: Record<string, boolean>;
    setFilesLoadingStatus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    title: string | undefined;
    setTitle: React.Dispatch<React.SetStateAction<string | undefined>>;
}> = ({
    open,
    handleClose,
    printItem,
    files,
    setFiles,
    selectedFiles,
    setSelectedFiles,
    filesLoadingStatus,
    setFilesLoadingStatus,
    onClick,
    title,
    setTitle,
}) => {
    const theme = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const { type, template, instance, options } = printItem;

    const getPropertiesFiles = useCallback((): IFile[] => {
        if (type === PrintType.Entity) return getFilesFromTemplate(instance.entity.properties, template);
        return getFilesFromTemplate(instance.details, template.details);
    }, [template, instance]);

    const getProcessStepsFiles = useCallback((): IFile[] => {
        if (type === PrintType.Entity) return [];
        return template.steps.flatMap((stepTemplate) => instance.steps.flatMap((step) => getFilesFromTemplate(step.properties ?? {}, stepTemplate)));
    }, [instance, template]);

    useEffect(() => {
        const filterFiles = ({ contentType }: IFile) => contentType !== 'video' && contentType !== 'audio' && contentType !== 'unsupported';
        const currFiles = getPropertiesFiles().filter(filterFiles).concat(getProcessStepsFiles().filter(filterFiles));

        setFiles(currFiles);
        setSelectedFiles([]);
    }, [getPropertiesFiles, getProcessStepsFiles, setFiles, setSelectedFiles]);

    useEffect(() => {
        setFilesLoadingStatus(
            selectedFiles.reduce((acc, file) => {
                return { ...acc, [file.id]: true };
            }, {}),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFiles]);

    useEffect(() => {
        if (Object.keys(filesLoadingStatus).length === 0) {
            setIsLoading(false);
            return;
        }
        setIsLoading(Object.values(filesLoadingStatus).some((loading) => loading));
    }, [filesLoadingStatus]);

    const getFile = (optionId: string) => files.find(({ id }) => id === optionId)!;

    return (
        <Dialog open={open} onClose={handleClose} onClick={(e) => e.stopPropagation()}>
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

            <DialogContent style={{ width: '600px' }}>
                <Grid>
                    <Grid marginTop={0.5} marginBottom={2}>
                        <TextField
                            fullWidth
                            value={title}
                            onChange={({ target: { value: newValue } }) => setTitle(newValue)}
                            label={i18next.t('entityPage.print.title')}
                        />
                    </Grid>
                    <Grid>
                        {type === PrintType.Entity && !!printItem.entityConnections.connectionsTemplates.length && (
                            <RelationshipSelection expandedEntity={instance} entityConnections={printItem.entityConnections} />
                        )}
                    </Grid>
                    <Grid marginTop={2}>
                        {files.length !== 0 && (
                            <MultipleSelect
                                id="print"
                                multiple
                                items={files.map(({ id, name }) => ({ label: name, value: id }))}
                                selectedValue={selectedFiles.map(({ id, name }) => ({ label: name, value: id }))}
                                onChange={(_event, newVal) => {
                                    if (newVal === null) return;
                                    setSelectedFiles(Array.isArray(newVal) ? newVal.map(({ value }) => getFile(value)) : [getFile(newVal.value)]);
                                }}
                                textFieldProps={{}}
                                onBlur={() => {}}
                                onFocus={() => {}}
                                variant="outlined"
                                rawErrors={[]}
                                label={i18next.t('entityPage.print.chooseFiles')}
                            />
                        )}
                    </Grid>
                    <Grid container marginTop={1} gap={1} padding={1}>
                        {Object.entries(options).map(([key, value]) => {
                            const isDisabled =
                                key === 'previewPropertiesOnly' && type === PrintType.Entity && template.propertiesPreview.length === 0;

                            const label = (
                                <FormControlLabel
                                    control={<MeltaSwitch id={key} name={key} checked={value.show} onChange={() => value.set((cur) => !cur)} />}
                                    label={i18next.t(value.label)}
                                    disabled={isDisabled}
                                    sx={{ color: '#53566E', fontSize: '14px' }}
                                />
                            );
                            return (
                                value && (
                                    <Grid key={key}>
                                        {isDisabled ? (
                                            <MeltaTooltip title={i18next.t('entityPage.print.noPreviewProperties')}>{label}</MeltaTooltip>
                                        ) : (
                                            label
                                        )}
                                    </Grid>
                                )
                            );
                        })}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Grid container justifyContent="center" marginBottom={2}>
                    <Button
                        variant="contained"
                        onClick={(ev) => {
                            handleClose();
                            onClick(ev);
                        }}
                        endIcon={<PrintOutlined />}
                        disabled={isLoading}
                        sx={{ borderRadius: '7px', fontWeight: 400 }}
                    >
                        {i18next.t('entityPage.print.continue')}
                        {isLoading && <CircularProgress size={20} />}
                    </Button>
                </Grid>
            </DialogActions>
        </Dialog>
    );
};

export default PrintOptionsDialog;
