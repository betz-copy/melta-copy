import React, { SetStateAction } from 'react';
import { Box, Switch, FormControlLabel } from '@mui/material';
import _debounce from 'lodash.debounce';
import i18next from 'i18next';
import { CommonFormInputProperties, IRelationshipReference } from '../commonInterfaces';
import { commentColors } from '../../../inputs/JSONSchemaFormik/RjsfCommentWidget';
import { IUniqueConstraintOfTemplate } from '../../../../interfaces/entities';
import { useQueryClient } from 'react-query';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import SelectAutocomplete from '../../../inputs/SelectAutocomplete';

export interface SwitchesProps {
    value: CommonFormInputProperties;
    setValues?: (value: SetStateAction<CommonFormInputProperties>) => void;
    index: number;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isEditMode?: boolean;
    initialValue: CommonFormInputProperties | undefined;
    templateId: string;
    unique?: boolean;
    uniqueConstraintGroupName: string | undefined;
    setUniqueConstraints?: (uniqueConstraints: SetStateAction<IUniqueConstraintOfTemplate[]>) => void;
    areThereAnyInstances?: boolean;
    supportChangeToRequiredWithInstances: boolean;
    supportUnique?: boolean;
    supportIdentifier?: boolean;
    hasIdentifier?: boolean;
}

export const Switches: React.FC<SwitchesProps> = ({
    value,
    setValues,
    index,
    onChange,
    isEditMode,
    initialValue,
    templateId,
    unique,
    uniqueConstraintGroupName,
    setUniqueConstraints,
    areThereAnyInstances,
    supportChangeToRequiredWithInstances,
    supportUnique,
    supportIdentifier,
    hasIdentifier,
}) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const isText = value.type === 'string' || value.type === 'text-area';
    const isComment = value.type === 'comment';
    const isNewProperty = !initialValue;
    const type = `properties[${index}].type`;

    const required = `properties[${index}].required`;
    const preview = `properties[${index}].preview`;
    const hide = `properties[${index}].hide`;
    const readOnly = `properties[${index}].readOnly`;
    const identifier = `properties[${index}].identifier`;
    const hideFromDetailsPage = `properties[${index}].hideFromDetailsPage`;

    const calculateTime = `properties[${index}].calculateTime`;
    const isIdentifierAble = isText || value.type === 'number' || value.type === 'pattern' || value.type === 'serialNumber';
    const commentColorsObj = Object.entries(commentColors).map(([label, val]) => ({ label, value: val }));

    const relationshipRefs = Array.from(entityTemplates.values()).reduce((acc: IRelationshipReference[], template) => {
        const properties = template.properties?.properties || {};

        const references = Object.values(properties).reduce((refAcc: IRelationshipReference[], property) => {
            if (property.format === 'relationshipReference' && property.relationshipReference) refAcc.push(property.relationshipReference);

            return refAcc;
        }, []);

        return acc.concat(references);
    }, []);

    const disableRemoveRequire = Boolean(
        relationshipRefs.find((ref) => ref.relatedTemplateField === value.name && ref.relatedTemplateId === templateId) !== undefined,
    );

    const createEmptyGroup = (fieldName) => {
        setUniqueConstraints!((prev) => {
            const existingGroup = prev?.find((group) => group.groupName === '' && group.properties.includes(fieldName));

            if (!existingGroup) {
                const newGroup = {
                    groupName: '',
                    properties: [fieldName],
                };
                const updatedConstraints = prev ? [...prev, newGroup] : [newGroup];
                return updatedConstraints;
            }
            return prev;
        });
    };

    const deletePropFromUniqueConstraints = (groupName, fieldName) => {
        setUniqueConstraints!((prev) => {
            const updatedConstraints = (prev || [])
                .map((group) => {
                    if (group.groupName === groupName) {
                        const updatedProperties = group.properties.filter((prop) => prop !== fieldName);
                        if (updatedProperties.length === 0) {
                            return null;
                        }
                        return {
                            ...group,
                            properties: updatedProperties,
                        };
                    }
                    return group;
                })
                .filter((group) => group !== null) as { groupName: string; properties: string[] }[];
            return updatedConstraints;
        });
    };
    return (
        <Box>
            {value.required !== undefined && setValues && !isComment && value.type !== 'kartoffelUserField' && (
                <FormControlLabel
                    control={
                        <Switch
                            id={required}
                            name={required}
                            onChange={(_e, checked) => {
                                setValues?.((prev) => ({
                                    ...prev,
                                    required: checked,
                                    identifier: !checked ? undefined : prev.identifier,
                                }));
                                // unique is allowed only if required=true, automatic uncheck 'unique' too
                                if (!checked && unique) {
                                    deletePropFromUniqueConstraints(uniqueConstraintGroupName, value.name);
                                }
                            }}
                            disabled={
                                value.type === 'serialNumber' ||
                                value.type === 'boolean' ||
                                value.readOnly ||
                                (supportChangeToRequiredWithInstances
                                    ? false
                                    : isEditMode && areThereAnyInstances && (isNewProperty || (!isNewProperty && !initialValue?.required))) ||
                                value.deleted ||
                                value.archive ||
                                disableRemoveRequire
                            }
                            checked={value.required}
                        />
                    }
                    label={i18next.t('validation.required')}
                />
            )}
            <FormControlLabel
                control={
                    <Switch
                        id={readOnly}
                        name={readOnly}
                        onChange={(_e, checked) => {
                            setValues?.((prev) => ({
                                ...prev,
                                readOnly: checked || undefined,
                            }));
                        }}
                        disabled={value.required || value.archive || value.type === 'kartoffelUserField' || isComment}
                        checked={value.readOnly || isComment}
                    />
                }
                label={i18next.t('validation.readOnly')}
            />
            {value.preview !== undefined && !isComment && (
                <FormControlLabel
                    control={
                        <Switch
                            id={preview}
                            name={preview}
                            onChange={onChange}
                            disabled={value.hide || value.deleted || value.archive}
                            checked={value.preview}
                        />
                    }
                    label={i18next.t('validation.preview')}
                />
            )}
            {value.hide !== undefined && (
                <FormControlLabel
                    control={
                        <Switch
                            id={hide}
                            name={hide}
                            onChange={onChange}
                            disabled={value.preview || value.deleted || value.archive}
                            checked={value.hide}
                        />
                    }
                    label={i18next.t('validation.hide')}
                />
            )}
            {supportUnique &&
                unique !== undefined &&
                setValues &&
                value.type !== 'signature' &&
                value.type !== 'kartoffelUserField' &&
                !isComment && (
                    <FormControlLabel
                        control={
                            <Switch
                                id={String(unique)}
                                name={String(unique)}
                                checked={unique}
                                disabled={value.archive || value.type === 'serialNumber'}
                                onChange={(_e, checked) => {
                                    setValues?.((prevValue) => ({
                                        ...prevValue,
                                        required: checked ? true : prevValue.required,
                                        identifier: !checked ? undefined : prevValue.identifier,
                                        groupName: undefined,
                                        uniqueCheckbox: false,
                                    }));

                                    if (checked) {
                                        createEmptyGroup(value.name);
                                    } else {
                                        deletePropFromUniqueConstraints(uniqueConstraintGroupName, value.name);
                                    }
                                }}
                            />
                        }
                        label={i18next.t('validation.unique')}
                    />
                )}
            {(value.type === 'date' || value.type === 'date-time') && 'calculateTime' in value && (
                <FormControlLabel
                    control={<Switch id={calculateTime} name={calculateTime} onChange={onChange} checked={value.calculateTime ?? false} />}
                    label={i18next.t('validation.calculateTime')}
                />
            )}
            {isText && (
                <FormControlLabel
                    control={
                        <Switch
                            id={type}
                            name={type}
                            onChange={(e) => {
                                const newFormatToText = e.target.checked ? 'text-area' : 'string';

                                setValues?.((prev) => ({
                                    ...prev,
                                    type: newFormatToText,
                                }));
                            }}
                            checked={value.type === 'text-area'}
                            disabled={value.archive}
                        />
                    }
                    label={i18next.t('propertyTypes.text-area')}
                />
            )}
            {isIdentifierAble && supportIdentifier && (
                <FormControlLabel
                    control={
                        <Switch
                            id={identifier}
                            name={identifier}
                            onChange={(_e, checked) => {
                                setValues?.((prevValue) => ({
                                    ...prevValue,
                                    required: checked ? true : prevValue.required,
                                    identifier: checked || undefined,
                                    groupName: undefined,
                                    uniqueCheckbox: false,
                                }));

                                if (checked) createEmptyGroup(value.name);
                            }}
                            disabled={(hasIdentifier && !value.identifier) || value.archive}
                            checked={value.identifier ?? false}
                        />
                    }
                    label={i18next.t('validation.identifier')}
                />
            )}
            {isComment && (
                <>
                    <FormControlLabel
                        control={
                            <Switch
                                id={hideFromDetailsPage}
                                name={hideFromDetailsPage}
                                onChange={(_e, checked) => {
                                    setValues?.((prev) => ({
                                        ...prev,
                                        hideFromDetailsPage: checked,
                                    }));
                                }}
                                checked={value.hideFromDetailsPage ?? false}
                            />
                        }
                        label={i18next.t('validation.hideFromDetailsPage')}
                    />
                    <SelectAutocomplete
                        options={commentColorsObj}
                        value={
                            value.color
                                ? {
                                      value: value.color,
                                      label: Object.entries(commentColors).find(([, val]) => val === value.color)?.[0]!,
                                  }
                                : commentColorsObj[0]
                        }
                        onValueChange={(newValue) => {
                            setValues?.((prev) => ({
                                ...prev,
                                color: newValue as string,
                            }));
                        }}
                        colorsOptions={commentColors}
                        disableClearable
                        label={i18next.t('validation.colors.colors')}
                        overrideSx={{ width: '150px' }}
                    />
                </>
            )}
        </Box>
    );
};
