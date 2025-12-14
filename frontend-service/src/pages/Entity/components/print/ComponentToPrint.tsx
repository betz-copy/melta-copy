import { Box, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import BlueTitle from '../../../../common/MeltaDesigns/BlueTitle';
import { FileToPrint } from '../../../../common/print/FileToPrint';
import { IEntity } from '../../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IFile } from '../../../../interfaces/preview';
import { EntityComponentToPrint } from './EntityComponentToPrint';

export type IEntityTreeNode = IEntity & { children: (IEntityTreeNode & { relationshipId: string })[] };

const ComponentToPrint = React.forwardRef<
    HTMLDivElement,
    {
        entityTemplate: IMongoEntityTemplatePopulated;
        entity?: IEntityTreeNode;
        filesToPrint?: IFile[];
        setSelectedFiles?: React.Dispatch<React.SetStateAction<IFile[]>>;
        setFilesLoadingStatus?: React.Dispatch<React.SetStateAction<{}>>;
        options: {
            showDisabled: boolean;
            showEntityDates: boolean;
            showEntityFiles: boolean;
            showPreviewPropertiesOnly: boolean;
        };
    }
>(({ entityTemplate, entity, options, filesToPrint = [], setSelectedFiles, setFilesLoadingStatus }, ref) => {
    const queryClient = useQueryClient();
    if (!entity) return <></>;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const populatedEntityTemplate = entityTemplates.get(entityTemplate._id)!;

    return (
        <Box ref={ref} margin="20px" style={{ direction: 'rtl', color: '#000' }}>
            <Grid style={{ pageBreakInside: 'avoid' }}>
                <Box paddingBottom="0.4rem" display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center">
                        <Typography component="h4" variant="h4" color="primary" fontWeight="800">
                            {populatedEntityTemplate.category.displayName}
                        </Typography>

                        <Typography variant="h4" fontSize="30px" color="#d3d8df" marginLeft="5px" marginRight="5px">
                            /
                        </Typography>

                        <Typography paddingBottom="2px" variant="h4" fontSize="28px" color="primary">
                            {populatedEntityTemplate.displayName}
                        </Typography>
                    </Box>
                    {<Box>{new Date().toLocaleDateString('en-uk')}</Box>}
                </Box>
                <EntityComponentToPrint entityTemplate={entityTemplate} entity={entity} options={options} hierarchicalChildren={entity.children} />
            </Grid>

            {options.showEntityFiles && filesToPrint.length > 0 && (
                <>
                    <Grid sx={{ width: '100%', height: '100%', paddingY: '55%', paddingX: '27%' }}>
                        <BlueTitle
                            title={i18next.t('entityPage.print.accompanyingFiles')}
                            component="h2"
                            variant="h2"
                            style={{ marginTop: '2rem' }}
                        />
                    </Grid>
                    {filesToPrint.map((file) => {
                        return (
                            <FileToPrint
                                file={file}
                                key={`${file.id}-${file.contentType}`}
                                onPreviewLoadingFinished={(error?: boolean) => {
                                    setFilesLoadingStatus?.((prev) => ({ ...prev, [file.id]: false }));
                                    if (error) {
                                        toast.error(i18next.t('entityPage.previewRefetch'));
                                        setSelectedFiles?.((prevSelectedFiles) =>
                                            prevSelectedFiles.filter((selectedFile) => selectedFile.id !== file.id),
                                        );
                                    }
                                }}
                            />
                        );
                    })}
                </>
            )}
        </Box>
    );
});

export { ComponentToPrint };
