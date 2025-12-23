import { Box, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import BlueTitle from '../../../../common/MeltaDesigns/BlueTitle';
import { FileToPrint } from '../../../../common/print/FileToPrint';
import { IEntity } from '../../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IFile } from '../../../../interfaces/preview';
import { IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';
import { EntityComponentToPrint } from './EntityComponentToPrint';

export type IEntityTreeNode = IEntity & { relationshipId: string; children: IEntityTreeNode[] };

const ComponentToPrint = React.forwardRef<
    HTMLDivElement,
    {
        entityTemplate: IMongoEntityTemplatePopulated;
        entity?: IEntityTreeNode;
        filesToPrint?: IFile[];
        setSelectedFiles?: React.Dispatch<React.SetStateAction<IFile[]>>;
        setFilesLoadingStatus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
        options: {
            showDisabled: boolean;
            showEntityDates: boolean;
            showEntityFiles: boolean;
            showPreviewPropertiesOnly: boolean;
            addEntityCheckbox?: boolean;
            appendSignatureField?: boolean;
        };
        printTitle?: string;
    }
>(({ entityTemplate, entity, options, filesToPrint = [], setSelectedFiles, setFilesLoadingStatus, printTitle }, ref) => {
    const theme = useTheme();
    const queryClient = useQueryClient();

    const { entityTemplates, relationships } = useMemo(
        () => ({
            entityTemplates: queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!,
            relationships: queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!,
        }),
        [queryClient],
    );

    if (!entity) return <></>;

    const signatureFields = (
        <Grid container flexDirection="column" marginTop="2.5rem" width="100%" rowGap="1.25rem">
            {['signedByDetails', 'stampedByDetails'].map((role) => (
                <Grid key={role} container width="100%" justifyContent="space-around">
                    <Grid width="6.25rem">
                        <Typography fontSize="0.875rem" fontWeight="600">
                            {i18next.t(`entityPage.print.signatureFields.${role}`)}
                        </Typography>
                    </Grid>
                    {['fullName', 'rank', 'personalNumber', 'signature'].map((field) => (
                        <Grid key={field} borderTop="1px solid #9398C2" width="7.5rem" marginTop="0.9375rem">
                            <Typography fontSize="0.875rem" textAlign="center" color="#787C9E">
                                {i18next.t(`entityPage.print.signatureFields.${field}`)}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
            ))}
        </Grid>
    );

    return (
        <Box ref={ref} margin="1.25rem" style={{ direction: 'rtl', color: '#000' }}>
            <Grid style={{ pageBreakInside: 'avoid' }}>
                <Typography color={theme.palette.primary.main} fontWeight={700} fontSize={'1.25rem'} marginBottom={'2rem'}>
                    {printTitle}
                </Typography>

                <EntityComponentToPrint
                    entityTemplates={entityTemplates}
                    relationships={relationships}
                    entityTemplate={entityTemplate}
                    entity={entity}
                    options={options}
                    hierarchicalChildren={entity.children}
                />
            </Grid>

            {options.showEntityFiles && filesToPrint.length > 0 && (
                <>
                    <Grid sx={{ width: '100%', height: '100%', paddingY: '27.5rem', paddingX: '13.5rem' }}>
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
            {options?.appendSignatureField && signatureFields}
        </Box>
    );
});

export { ComponentToPrint };
