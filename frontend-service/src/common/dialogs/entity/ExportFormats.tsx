import { FileDownloadOutlined } from '@mui/icons-material';
import { Autocomplete, Button, CircularProgress, Grid, TextField } from '@mui/material';
import { IEntity } from '@packages/entity';
import { IEntityTemplateMap } from '@packages/entity-template';
import i18next from 'i18next';
import fileDownload from 'js-file-download';
import _ from 'lodash';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { exportEntityToDocumentRequest } from '../../../services/entitiesService';
import { getLongDate } from '../../../utils/date';
import { getFileName } from '../../../utils/getFileName';
import { locationConverterToString } from '../../../utils/map/convert';
import { CoordinateSystem } from '../../inputs/JSONSchemaFormik/Widgets/RjsfLocationWidget';
import { EntityWizardValues } from '.';

export const ExportFormats: React.FC<{
    properties: EntityWizardValues['properties'];
    templateId: IEntity['templateId'];
    documentTemplateIds?: string[];
    disabled?: boolean;
    justifyContent?: React.CSSProperties['justifyContent'];
}> = ({ properties, templateId, documentTemplateIds = [], disabled = false, justifyContent }) => {
    const queryClient = useQueryClient();
    const entityTemplates: IEntityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const formatFieldsForExport = (): EntityWizardValues['properties'] => {
        // the copy is created so it wouldn't change the original expandedEntity.
        const propertyCopy = _.cloneDeep(properties);

        for (const [fieldKey, field] of Object.entries(entityTemplates.get(templateId)!.properties.properties)) {
            if (field?.format === 'relationshipReference' && field?.relationshipReference?.relatedTemplateField) {
                const relatedField: string = field.relationshipReference.relatedTemplateField;
                const relationshipObject = propertyCopy?.[fieldKey];

                if (relationshipObject && typeof relationshipObject === 'object' && relationshipObject.properties) {
                    const relatedEntityTemplate = entityTemplates.get(field.relationshipReference.relatedTemplateId);

                    if (relatedEntityTemplate) {
                        if (relatedEntityTemplate?.properties.properties[relatedField].format === 'location') {
                            //is a location
                            propertyCopy[fieldKey] = {
                                ...relationshipObject.properties?.[relatedField],
                                coordinateSystem: relationshipObject.properties?.[`${relatedField}_coordinateSystem`],
                            };
                        } else {
                            const relationshipField = relationshipObject.properties?.[relatedField];
                            propertyCopy[fieldKey] = relationshipField;
                        }
                    } else {
                        propertyCopy[fieldKey] = i18next.t('templateEntitiesAutocomplete.noWritePermissions');
                    }
                }
            } else if (field?.format === 'user') {
                // Sometimes and somewhere user is sent as a stringified JSON.
                try {
                    propertyCopy[fieldKey] = JSON.parse(propertyCopy[fieldKey]);
                } catch {}
            } else if (field.type === 'array' && field.items?.format === 'user') {
                // Sometimes and somewhere users are sent as an array of stringified JSONs, and sometimes as an object with arrays of each user field.
                if (propertyCopy[fieldKey]) {
                    const parsed = propertyCopy[fieldKey].map((field) => {
                        try {
                            return JSON.parse(field);
                        } catch {
                            return field;
                        }
                    });

                    propertyCopy[fieldKey] = {
                        ids: parsed.map((user) => user._id),
                        fullNames: parsed.map((user) => user.fullName),
                        jobTitles: parsed.map((user) => user.jobTitle),
                        hierarchies: parsed.map((user) => user.hierarchy),
                        mails: parsed.map((user) => user.mail),
                    };
                }
            }

            const expandedField = propertyCopy?.[fieldKey];

            if (expandedField?.location) {
                propertyCopy[fieldKey] =
                    expandedField.coordinateSystem === CoordinateSystem.UTM
                        ? locationConverterToString(expandedField.location, CoordinateSystem.WGS84, CoordinateSystem.UTM)
                        : expandedField.location;
            } else if (expandedField?.fullName) propertyCopy[fieldKey] = expandedField.fullName;
            else if (Array.isArray(expandedField))
                propertyCopy[fieldKey] = expandedField.map((item) => {
                    try {
                        return JSON.parse(item).fullName;
                    } catch {
                        return item;
                    }
                });
            else if (expandedField?.fullNames) propertyCopy[fieldKey] = expandedField.fullNames;
        }

        return propertyCopy;
    };

    const [selectedFileToExport, setSelectedFileToExport] = useState('');

    const { isLoading: isExportToFileLoading, mutate: exportMutation } = useMutation(
        ({ documentTemplateId, entity }: { documentTemplateId: string; entity: IEntity }) =>
            exportEntityToDocumentRequest(documentTemplateId, entity),
        {
            onSuccess: (file) => {
                const [fileName, fileExtension] = getFileName(selectedFileToExport).split('.');
                fileDownload(file, `${fileName}_${getLongDate(new Date())}.${fileExtension}`);
            },
            onError: () => {
                toast.error(i18next.t('errorPage.fileDownloadError'));
            },
        },
    );

    return (
        <Grid container justifyContent={justifyContent} flexDirection="row" flexWrap="nowrap" spacing={2} alignItems="center">
            <Grid>
                <Autocomplete
                    options={documentTemplateIds.map((fileName) => ({
                        label: getFileName(fileName),
                        value: fileName,
                    }))}
                    onChange={(_e, selectedOption) => setSelectedFileToExport(selectedOption?.value!)}
                    disabled={disabled}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            size="small"
                            sx={{
                                '& .MuiInputBase-root': {
                                    borderRadius: '10px',
                                    width: 250,
                                },
                                '& fieldset': {
                                    borderColor: '#CCCFE5',
                                    color: '#CCCFE5',
                                },
                                '& label': {
                                    color: '#9398C2',
                                },
                            }}
                            name="selectedExportFormat"
                            variant="outlined"
                            label={i18next.t('wizard.entityTemplate.exportDocuments')}
                        />
                    )}
                />
            </Grid>

            <Grid>
                <Button
                    sx={{
                        borderRadius: '0.5rem',
                        ':hover': { color: 'white' },
                        textWrap: 'nowrap',
                    }}
                    variant="contained"
                    startIcon={isExportToFileLoading ? <CircularProgress /> : <FileDownloadOutlined />}
                    onClick={() => {
                        exportMutation({
                            documentTemplateId: selectedFileToExport,
                            entity: { templateId, properties: formatFieldsForExport() as IEntity['properties'] },
                        });
                    }}
                    disabled={!selectedFileToExport?.length || isExportToFileLoading}
                >
                    {i18next.t('entityPage.download')}
                </Button>
            </Grid>
        </Grid>
    );
};
