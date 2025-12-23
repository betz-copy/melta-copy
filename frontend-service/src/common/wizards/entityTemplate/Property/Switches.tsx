import { Box, FormControlLabel } from '@mui/material';
import i18next from 'i18next';
import React, { SetStateAction } from 'react';
import { useQueryClient } from 'react-query';
import { ISearchFilter, IUniqueConstraintOfTemplate } from '../../../../interfaces/entities';
import { IEntityTemplateMap, PropertyFormat, PropertyType } from '../../../../interfaces/entityTemplates';
import { MinimizedColorPicker } from '../../../inputs/MinimizedColorPicker';
import MeltaSwitch from '../../../MeltaDesigns/MeltaSwitch';
import { CommonFormInputProperties, IRelationshipReference } from '../commonInterfaces';

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

    const isText = value.type === PropertyType.string || value.type === PropertyFormat['text-area'];
    const isComment = value.type === PropertyFormat.comment;
    const isKartoffelImage = value.type === PropertyFormat.kartoffelUserField && value?.expandedUserField?.kartoffelField === 'image';
    const isNewProperty = !initialValue;

    const property = `properties[${index}]`;
    const type = `${property}.type`;
    const required = `${property}.required`;
    const preview = `${property}.preview`;
    const hide = `${property}.hide`;
    const readOnly = `${property}.readOnly`;
    const identifier = `${property}.identifier`;
    const hideFromDetailsPage = `${property}.hideFromDetailsPage`;

    const calculateTime = `${property}.calculateTime`;
    const isIdentifierAble = isText || value.type === PropertyType.number || value.type === 'pattern' || value.type === 'serialNumber';

    // TODO: when upgrading the mongo version to v5, update the types and delete the (Omit<IRelationshipReference, 'filters'> & { filters?: string | ISearchFilter })[] type
    const relationshipRefs = Array.from(entityTemplates.values()).reduce(
        (acc: (Omit<IRelationshipReference, 'filters'> & { filters?: string | ISearchFilter })[], template) => {
            const properties = template.properties?.properties || {};

            const references = Object.values(properties).reduce(
                (refAcc: (Omit<IRelationshipReference, 'filters'> & { filters?: string | ISearchFilter })[], property) => {
                    if (property.format === PropertyFormat.relationshipReference && property.relationshipReference)
                        refAcc.push(property.relationshipReference);

                    return refAcc;
                },
                [],
            );

            return acc.concat(references);
        },
        [],
    );

    const disableRemoveRequire = Boolean(
        relationshipRefs.find((ref) => ref.relatedTemplateField === value.name && ref.relatedTemplateId === templateId) !== undefined,
    );

    const createEmptyGroup = (fieldName: string) => {
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

    const deletePropFromUniqueConstraints = (groupName: string | undefined, fieldName: string) => {
        setUniqueConstraints!((prev) => {
            const updatedConstraints = (prev || [])
                .map((group) => {
                    if (group.groupName === groupName) {
                        const updatedProperties = group.properties.filter((prop) => prop !== fieldName);
                        if (updatedProperties.length === 0) return null;

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
            {value.required !== undefined && setValues && !isComment && value.type !== PropertyFormat.kartoffelUserField && (
                <FormControlLabel
                    control={
                        <MeltaSwitch
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
                                value.type === PropertyType.boolean ||
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
                    <MeltaSwitch
                        id={readOnly}
                        name={readOnly}
                        onChange={(_e, checked) => {
                            setValues?.((prev) => ({
                                ...prev,
                                readOnly: checked || undefined,
                            }));
                        }}
                        disabled={value.required || value.archive || value.type === PropertyFormat.kartoffelUserField || isComment}
                        checked={value.readOnly || isComment}
                    />
                }
                label={i18next.t('validation.readOnly')}
            />
            {value.preview !== undefined && !isComment && (
                <FormControlLabel
                    control={
                        <MeltaSwitch
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
                        <MeltaSwitch
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
                value.type !== PropertyFormat.signature &&
                value.type !== PropertyFormat.kartoffelUserField &&
                !isComment && (
                    <FormControlLabel
                        control={
                            <MeltaSwitch
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

                                    if (checked) createEmptyGroup(value.name);
                                    else deletePropFromUniqueConstraints(uniqueConstraintGroupName, value.name);
                                }}
                            />
                        }
                        label={i18next.t('validation.unique')}
                    />
                )}
            {(value.type === PropertyFormat.date || value.type === PropertyFormat['date-time']) && 'calculateTime' in value && (
                <FormControlLabel
                    control={<MeltaSwitch id={calculateTime} name={calculateTime} onChange={onChange} checked={value.calculateTime ?? false} />}
                    label={i18next.t('validation.calculateTime')}
                />
            )}
            {isText && (
                <FormControlLabel
                    control={
                        <MeltaSwitch
                            id={type}
                            name={type}
                            onChange={(e) => {
                                const newFormatToText = e.target.checked ? PropertyFormat['text-area'] : PropertyType.string;

                                setValues?.((prev) => ({
                                    ...prev,
                                    type: newFormatToText,
                                }));
                            }}
                            checked={value.type === PropertyFormat['text-area']}
                            disabled={value.archive}
                        />
                    }
                    label={i18next.t('propertyTypes.text-area')}
                />
            )}
            {isIdentifierAble && supportIdentifier && (
                <FormControlLabel
                    control={
                        <MeltaSwitch
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
                            <MeltaSwitch
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
                    <MinimizedColorPicker
                        color={value.color}
                        onColorChange={(newValue) => {
                            setValues?.((prev) => ({
                                ...prev,
                                color: newValue,
                            }));
                        }}
                        circleSize="1.6rem"
                    />
                </>
            )}
            {isKartoffelImage && (
                <FormControlLabel
                    control={
                        <MeltaSwitch
                            id={`${property}.isProfileImage`}
                            name={`${property}.isProfileImage`}
                            onChange={(_e, checked) => {
                                setValues?.((prev) => ({
                                    ...prev,
                                    isProfileImage: checked,
                                }));
                            }}
                            checked={value.isProfileImage ?? false}
                        />
                    }
                    label={i18next.t('validation.isProfileImage')}
                />
            )}
        </Box>
    );
};
