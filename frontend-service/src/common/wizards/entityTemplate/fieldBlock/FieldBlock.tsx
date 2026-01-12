import { DragHandle as DragHandleIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { AccordionDetails, AccordionSummary, Box, Button, Grid, Typography } from '@mui/material';
import { IPropertyValue } from '@packages/entity';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated, IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { FormikErrors, FormikTouched } from 'formik';
import i18next from 'i18next';
import { debounce } from 'lodash';
import React, { SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useQueryClient } from 'react-query';
import { v4 as uuid } from 'uuid';
import { AreYouSureDialog } from '../../../dialogs/AreYouSureDialog';
import { PropertiesTypes } from '../AddFields';
import { CommonFormInputProperties, FieldProperty, GroupProperty, PropertyItem } from '../commonInterfaces';
import { FieldEditCardProps } from '../FieldEditCard';
import { FieldBlockAccordion, FieldBlockProps, ItemTypes } from './interfaces';
import { Attachment, Field, Group, getFieldData } from './propertiesTypes';

export const FieldBlockDND = <PropertiesType extends string, Values extends Record<PropertiesType, PropertyItem[]>>({
    propertiesType,
    values,
    uniqueConstraints,
    setUniqueConstraints,
    initialValues,
    setFieldValue,
    areThereAnyInstances,
    isEditMode,
    setBlock,
    title,
    addPropertyButtonLabel,
    touched,
    errors,
    supportSerialNumberType,
    supportUserType,
    supportEntityReferenceType,
    supportChangeToRequiredWithInstances,
    supportArrayFields,
    supportDeleteForExistingInstances,
    supportRelationshipReference,
    supportEditEnum,
    supportUnique,
    supportLocation,
    supportArchive,
    locationSearchFields,
    supportIdentifier,
    hasIdentifier,
    supportAddFieldButton = true,
    hasActions,
    draggable = { isDraggable: false },
    initialFieldCardDataOnAdd = {
        name: '',
        title: '',
        type: '',
        required: false,
        preview: false,
        hide: false,
        groupName: undefined,
        uniqueCheckbox: false,
        options: [],
        optionColors: {},
        pattern: '',
        patternCustomErrorMessage: '',
        dateNotification: undefined,
        calculateTime: undefined,
        relationshipReference: undefined,
        serialStarter: 0,
        archive: false,
        deleted: false,
        mapSearch: false,
    },
    initialGroupCardDataOnAdd = {
        type: 'group',
        id: uuid(),
        name: '',
        displayName: '',
        fields: [],
    },
    supportConvertingToMultipleFields = true,
    supportComment,
    archive,
    onDeleteSure,
    remove,
    userPropertiesInTemplate,
    isAccountTemplate = false,
    hasAccountBalanceField,
    isAlreadyWalletTemplate,
    setIsTransferTemplate,
}: React.PropsWithChildren<FieldBlockProps<PropertiesType, Values>>) => {
    // copy of values of formik in order to show changes on inputs fast (formik rerenders are slow)
    // using ordered item ref because update functions (push/remove/...) are not updated for the field cards on
    // every re-render and if displayValues changes, it does not update in the functions of the field cards.
    // therefore using a reference for them to always use the current orderedItems.
    const [orderedItems, setOrderedItems] = useState(values[propertiesType]);

    const [showAreUSureDialogForRemoveProperty, setShowAreUSureDialogForRemoveProperty] = useState<boolean>(false);
    const [selectedIndexesToRemove, setSelectedIndexesForRemove] = useState<{ index: number; groupIndex?: number }[]>([]);

    const orderedItemsRef = useRef(orderedItems);
    orderedItemsRef.current = orderedItems;

    const queryClient = useQueryClient();
    const templates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates') || new Map();

    // biome-ignore lint/correctness/useExhaustiveDependencies: re-render
    useEffect(() => {
        setFieldValue(propertiesType, orderedItems);
    }, []);

    // biome-ignore lint/correctness/useExhaustiveDependencies: re-render
    useEffect(() => {
        setOrderedItems(values[propertiesType]);
        orderedItemsRef.current = values[propertiesType];
    }, [values[propertiesType]]);

    useEffect(() => {
        if (!orderedItems?.length || !templates?.size) return;
        const templateHasAccountBalance = (template: IMongoEntityTemplatePopulated) =>
            Object.values(template?.properties?.properties ?? {}).some((property) => property.accountBalance);

        const hasRelatedAccountBalance = (relatedId?: string) => {
            if (!relatedId) return false;
            const relatedTemplate = templates.get(relatedId);
            return relatedTemplate ? templateHasAccountBalance(relatedTemplate) : false;
        };
        setIsTransferTemplate?.(
            orderedItems.some((property) => {
                if (property.type === 'field' && property.data?.relationshipReference)
                    return hasRelatedAccountBalance(property.data.relationshipReference.relatedTemplateId);
                if (property.type === 'group')
                    return property.fields.some((field) => hasRelatedAccountBalance(field.relationshipReference?.relatedTemplateId));
                return false;
            }),
        );
    }, [orderedItems, templates, setIsTransferTemplate]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const updateFormikDebounced = useCallback(
        debounce(() => {
            setFieldValue(propertiesType, [...orderedItemsRef.current], true);
            setBlock(false);
        }, 1000),
        [],
    );

    const updateFormik = () => {
        setBlock(true);
        updateFormikDebounced();
    };

    const setFieldDisplayValue = (indexesToUpdate: { index: number; groupIndex?: number }[], field: keyof Values, value: IPropertyValue) => {
        const displayValuesCopy = [...orderedItemsRef.current] as Values[PropertiesType];
        indexesToUpdate.forEach(({ index, groupIndex }) => {
            if (groupIndex !== undefined) {
                const group = displayValuesCopy[groupIndex] as GroupProperty;

                if (!group) return;

                group.fields[index] = {
                    ...group.fields[index],
                    [field]: value,
                };

                if (field === 'name' && group.fields[index].type === 'comment')
                    group.fields[index].title = `${i18next.t('propertyTypes.comment')}-${value}`;
            } else {
                const fieldProperty = displayValuesCopy[index] as FieldProperty;
                displayValuesCopy[index] = {
                    ...fieldProperty,
                    data: {
                        ...fieldProperty.data,
                        [field]: value,
                    },
                };

                if (field === 'name' && (displayValuesCopy[index] as FieldProperty).data.type === 'comment')
                    (displayValuesCopy[index] as FieldProperty).data.title = `${i18next.t('propertyTypes.comment')}-${value}`;
            }
        });

        setOrderedItems(displayValuesCopy);
        updateFormik();
    };

    const onSimpleDeleteSure = () => {
        setShowAreUSureDialogForRemoveProperty(false);
        setFieldDisplayValue(selectedIndexesToRemove, 'deleted' as keyof Values, true);
    };

    const push = (properties) => {
        const updatedItems = [...orderedItemsRef.current, properties] as Values[PropertiesType];
        setOrderedItems(updatedItems);
        updateFormik();
    };

    const removeGroup = (index: number) => {
        const displayValuesCopy = [...orderedItemsRef.current] as Values[PropertiesType];

        displayValuesCopy.splice(index, 1);

        setOrderedItems(displayValuesCopy);
        updateFormik();
    };

    const simpleRemove = (index: number, isNewProperty: boolean, groupIndex?: number) => {
        const displayValuesCopy = [...orderedItemsRef.current] as Values[PropertiesType];
        const field = getFieldData(displayValuesCopy, index, groupIndex);

        const isDeleted = field.deleted;

        if (!isDeleted && (!areThereAnyInstances || isNewProperty)) {
            let removedField: CommonFormInputProperties;
            if (groupIndex !== undefined) {
                const group = displayValuesCopy[groupIndex] as GroupProperty;
                if (!group || !group.fields) return;

                removedField = group.fields[index];

                group.fields.splice(index, 1);
            } else {
                removedField = (displayValuesCopy[index] as FieldProperty).data;
                displayValuesCopy.splice(index, 1);
            }
            if (removedField.type === 'user') {
                for (let i = displayValuesCopy.length - 1; i >= 0; i--) {
                    if (displayValuesCopy[i].type === 'group') {
                        (displayValuesCopy[i] as GroupProperty).fields.filter(
                            (fieldData) =>
                                !(fieldData.type === 'kartoffelUserField' && fieldData.expandedUserField?.relatedUserField === removedField.name),
                        );
                    } else {
                        const item = displayValuesCopy[i] as FieldProperty;
                        if (item.data.type === 'kartoffelUserField' && item.data.expandedUserField?.relatedUserField === removedField.name) {
                            displayValuesCopy.splice(i, 1);
                        }
                    }
                }
            }

            setOrderedItems(displayValuesCopy);
            updateFormik();

            return;
        }

        if (remove) {
            setSelectedIndexesForRemove([{ index, groupIndex }]);
            remove(index, isNewProperty, propertiesType as PropertiesTypes, setShowAreUSureDialogForRemoveProperty, groupIndex);

            return;
        }

        if (isDeleted) {
            const indexesToUpdate: { index: number; groupIndex?: number }[] = [{ index, groupIndex }];

            if (field.type === 'kartoffelUserField') {
                const relatedUserFieldName = field.expandedUserField?.relatedUserField;

                if (relatedUserFieldName) {
                    displayValuesCopy.forEach((item, idx) => {
                        if (item.type === 'group') {
                            item.fields.forEach((nestedField, nestedIndex) => {
                                if (nestedField.type === 'user' && nestedField.name === relatedUserFieldName && nestedField.deleted)
                                    indexesToUpdate.push({ index: nestedIndex, groupIndex: idx });
                            });
                        } else if (item.data.type === 'user' && item.data.name === relatedUserFieldName && item.data.deleted)
                            indexesToUpdate.push({ index: idx });
                    });
                }
            }

            setFieldDisplayValue(indexesToUpdate, 'deleted' as keyof Values, false);
        } else if (areThereAnyInstances && !isNewProperty) {
            const indexesToUpdate: { index: number; groupIndex?: number }[] = [{ index, groupIndex }];

            if (field.type === 'user') {
                const userFieldName = field.name;

                displayValuesCopy.forEach((item, idx) => {
                    if (item.type === 'group') {
                        item.fields.forEach((nestedField, nestedIndex) => {
                            if (nestedField.type === 'kartoffelUserField' && nestedField.expandedUserField?.relatedUserField === userFieldName) {
                                indexesToUpdate.push({ index: nestedIndex, groupIndex: idx });
                            }
                        });
                    } else if (item.data.type === 'kartoffelUserField' && item.data.expandedUserField?.relatedUserField === userFieldName) {
                        indexesToUpdate.push({ index: idx });
                    }
                });
            }

            setShowAreUSureDialogForRemoveProperty(true);
            setSelectedIndexesForRemove(indexesToUpdate);
        }
    };

    const setDisplayValue = (index: number, valueOrFunc: SetStateAction<CommonFormInputProperties>, groupId?: string) => {
        const displayValuesCopy = [...orderedItemsRef.current] as Values[PropertiesType];

        if (groupId) {
            const group = displayValuesCopy.find((val) => val.type === 'group' && val.id === groupId) as GroupProperty;
            if (!group) return;

            const updatedField = typeof valueOrFunc === 'function' ? valueOrFunc(group.fields[index]) : valueOrFunc;
            group.fields[index] = updatedField;
        } else {
            const updatedValue = typeof valueOrFunc === 'function' ? valueOrFunc((displayValuesCopy[index] as FieldProperty).data) : valueOrFunc;
            displayValuesCopy[index] = { type: 'field', data: updatedValue };
        }

        setOrderedItems(displayValuesCopy);
        updateFormik();
    };

    const onChangeGroupData = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, groupId: string) => {
        const inputName = event.target.name.split('.')[1];
        const inputValue = event.target.type === 'checkbox' && event.target instanceof HTMLInputElement ? event.target.checked : event.target.value;

        const displayValuesCopy = [...orderedItemsRef.current] as Values[PropertiesType];

        const groupIndex = displayValuesCopy.findIndex((value) => value.type === 'group' && value.id === groupId);

        if (groupIndex === -1) return;

        const oldGroup = displayValuesCopy[groupIndex] as GroupProperty;

        const updatedGroup = {
            ...oldGroup,
            [inputName]: inputValue,
            fields: oldGroup.fields.map((field) => ({
                ...field,
                fieldGroup: {
                    ...field.fieldGroup,
                    [inputName]: inputValue,
                },
            })),
        };

        displayValuesCopy[groupIndex] = updatedGroup as GroupProperty;

        setOrderedItems(displayValuesCopy);
        updateFormik();
    };

    const onChange = (index: number, event: React.ChangeEvent<HTMLInputElement>, groupIndex?: number) => {
        const inputName = event.target.name.split('.')[1]; // the input name is in the format `properties[index].field`
        const inputValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setFieldDisplayValue([{ index, groupIndex }], inputName as keyof Values, inputValue);
    };

    const onChangeWrapper = (index: number, groupIndex?: number) => (event: React.ChangeEvent<HTMLInputElement>) =>
        onChange(index, event, groupIndex);

    const setFieldDisplayValueWrapper = (index: number, groupIndex?: number) => (field: keyof Values, value: IPropertyValue) =>
        setFieldDisplayValue([{ index, groupIndex }], field, value);
    const setDisplayValueWrapper = (index: number, groupId?: string) => (value: SetStateAction<CommonFormInputProperties>) =>
        setDisplayValue(index, value, groupId);

    const isFieldBlockError = Boolean(touched?.[propertiesType]) && Boolean(errors?.[propertiesType]);

    const onDuplicateKartoffelField = (fieldIndex: number, groupIndex?: number) => {
        const displayValuesCopy = [...orderedItemsRef.current] as Values[PropertiesType];

        const isGrouped = typeof groupIndex === 'number';
        const sourceField = getFieldData(displayValuesCopy, fieldIndex, groupIndex);

        const newField = {
            id: uuid(),
            ...initialFieldCardDataOnAdd,
            type: 'kartoffelUserField',
            readOnly: true,
            expandedUserField: {
                relatedUserField: sourceField.expandedUserField?.relatedUserField || '',
                kartoffelField: '',
            },
        };

        if (isGrouped) {
            (displayValuesCopy[groupIndex] as GroupProperty).fields.splice(fieldIndex + 1, 0, newField);
        } else {
            displayValuesCopy.splice(fieldIndex + 1, 0, { data: newField, type: 'field' });
        }

        setOrderedItems(displayValuesCopy);
        updateFormik();
    };

    const buildProps = (propertyProp: CommonFormInputProperties, index: number, groupIndex?: number): Omit<FieldEditCardProps, 'setFieldValue'> => {
        const isGroup = groupIndex !== undefined;
        const currentTypeValues = initialValues?.[propertiesType];
        let error: FieldEditCardProps['errors'];
        let touch: FieldEditCardProps['touched'];

        const getTouchedOrError = (obj?: FormikTouched<Values> | FormikErrors<Values>) =>
            isGroup ? obj?.[propertiesType]?.[groupIndex]?.fields?.[index] : obj?.[propertiesType]?.[index]?.data;

        const findInitialValue = ():
            | FieldProperty
            | {
                  data: CommonFormInputProperties | undefined;
              }
            | undefined => {
            error = getTouchedOrError(errors);
            touch = getTouchedOrError(touched);
            const directField = currentTypeValues?.find((item) => item.type === 'field' && item.data?.id === propertyProp.id);

            if (directField) return directField as FieldProperty;

            const group = currentTypeValues?.find(
                (item) => item.type === 'group' && item.fields?.some((f) => f.id === propertyProp.id),
            ) as GroupProperty;
            if (group) return { data: group.fields?.find((f) => f.id === propertyProp.id) };

            return undefined;
        };

        const initialVal = findInitialValue();

        return {
            // biome-ignore lint/suspicious/noExplicitAny: types are shit in this page
            entity: (values as any).displayName,
            value: propertyProp,
            index,
            isEditMode,
            initialValue: initialVal?.data,
            areThereAnyInstances,
            touched: touch,
            errors: error,
            archive,
            remove: simpleRemove,
            onChange: onChangeWrapper(index, groupIndex),
            supportSerialNumberType,
            supportUserType,
            supportEntityReferenceType,
            supportChangeToRequiredWithInstances,
            // biome-ignore lint/suspicious/noExplicitAny: types are shit in this page
            templateId: (values as any)._id,
            supportArrayFields,
            supportDeleteForExistingInstances,
            supportEditEnum,
            supportRelationshipReference,
            supportUnique,
            supportLocation,
            supportArchive,
            supportIdentifier,
            hasIdentifier,
            locationSearchFields,
            hasActions,
            supportConvertingToMultipleFields,
            groupIndex,
            supportComment,
            userPropertiesInTemplate,
            onDuplicateKartoffelField,
            propertiesType,
            hasAccountBalanceField,
            isAlreadyWalletTemplate,
            values,
        };
    };

    const addFieldToGroup = (item: GroupProperty) => {
        const { name, displayName, id } = item;
        const displayValuesCopy = [...orderedItemsRef.current] as Values[PropertiesType];

        const newField = { ...initialFieldCardDataOnAdd, id: uuid(), fieldGroup: { name, displayName, id } };

        const group = displayValuesCopy.find((val) => val.type === 'group' && val.id === id) as GroupProperty;

        if (!group) return;

        group.fields = [...group.fields, newField];

        setOrderedItems(displayValuesCopy);

        updateFormik();
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: re-render
    const moveGroup = useCallback((group: GroupProperty, toIndex: number, toGroupId: string | null = null) => {
        if (toGroupId) {
            console.warn('Groups cannot be moved into other groups.');
            return;
        }

        const orderedItemsCopy = [...orderedItemsRef.current] as Values[PropertiesType];
        const fromIndex = orderedItemsCopy.findIndex((el) => el.type === 'group' && el.id === group.id);
        if (fromIndex === -1) return;

        const movedGroup = orderedItemsCopy.splice(fromIndex, 1)[0];
        orderedItemsCopy.splice(toIndex, 0, movedGroup);

        setOrderedItems(orderedItemsCopy);
        updateFormik();
    }, []);

    // biome-ignore lint/correctness/useExhaustiveDependencies: re-render
    const moveField = useCallback((item: CommonFormInputProperties, toIndex: number, toGroupId: string | null) => {
        const orderedItemsCopy = [...orderedItemsRef.current] as Values[PropertiesType];
        let movedField: CommonFormInputProperties | null = null;

        if (item.fieldGroup) {
            const fromGroupIndex = orderedItemsCopy.findIndex((el) => el.type === 'group' && el.id === item.fieldGroup?.id);
            if (fromGroupIndex === -1) return;

            const fromGroup = orderedItemsCopy[fromGroupIndex] as GroupProperty;
            const fieldIndex = fromGroup.fields.findIndex((f) => f.id === item.id);
            if (fieldIndex === -1) return;

            movedField = fromGroup.fields.splice(fieldIndex, 1)[0];
        } else {
            const index = orderedItemsCopy.findIndex((el) => el.type === 'field' && el.data.id === item.id);
            if (index === -1) return;

            movedField = (orderedItemsCopy.splice(index, 1)[0] as FieldProperty).data;
        }

        if (toGroupId) {
            const toGroupIndex = orderedItemsCopy.findIndex((el) => el.type === 'group' && el.id === toGroupId);
            if (toGroupIndex === -1) return;

            const group = orderedItemsCopy[toGroupIndex] as GroupProperty;
            const { name, displayName } = group;

            group.fields.splice(toIndex, 0, {
                ...movedField,
                fieldGroup: { name, displayName, id: toGroupId },
            });
        } else {
            const { fieldGroup: _f, ...movedGroupData } = movedField;
            orderedItemsCopy.splice(toIndex, 0, { type: 'field', data: movedGroupData });
        }

        setOrderedItems(orderedItemsCopy);
        updateFormik();
    }, []);

    type DragFieldItem = CommonFormInputProperties & {
        index: number;
    };

    type DragGroupItem = GroupProperty & {
        index: number;
    };

    type DragItem = DragFieldItem | DragGroupItem;

    const [, drop] = useDrop<DragItem, void, unknown>(() => ({
        accept: [ItemTypes.FIELD, ItemTypes.GROUP],
        drop: (item, monitor) => {
            if (monitor.didDrop()) return;

            if ('fields' in item) return;

            moveField(item, item.index, null);
        },
    }));

    return (
        <FieldBlockAccordion style={{ border: isFieldBlockError ? '1px solid red' : '' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container wrap="nowrap" alignItems="center">
                    {draggable?.isDraggable && (
                        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'grab' }}>
                            <DragHandleIcon fontSize="large" />
                        </Box>
                    )}

                    <Typography>{title}</Typography>
                </Grid>
            </AccordionSummary>

            <AccordionDetails sx={{ paddingTop: 0 }}>
                <div
                    key={propertiesType}
                    ref={(node) => {
                        // biome-ignore lint/suspicious/noExplicitAny: lol
                        drop(node as any);
                    }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        paddingTop: '17px',
                        paddingBottom: '10px',
                    }}
                >
                    <Grid>
                        {orderedItems.map((item, index) => {
                            if (
                                [PropertiesTypes.properties, PropertiesTypes.detailsProperties, PropertiesTypes.archiveProperties].includes(
                                    propertiesType as PropertiesTypes,
                                )
                            )
                                return (
                                    <Box key={item.type === 'group' ? item.id : item.data.id} sx={{ marginBottom: 0.5 }}>
                                        {item.type === 'group' ? (
                                            <Group
                                                group={item}
                                                index={index}
                                                values={values}
                                                moveField={moveField}
                                                moveGroup={moveGroup}
                                                touched={touched}
                                                errors={errors}
                                                propertiesType={propertiesType}
                                                onChangeGroupData={onChangeGroupData}
                                                remove={removeGroup}
                                                setDisplayValueWrapper={setDisplayValueWrapper}
                                                setFieldDisplayValueWrapper={setFieldDisplayValueWrapper}
                                                setUniqueConstraints={setUniqueConstraints}
                                                uniqueConstraints={uniqueConstraints}
                                                buildProps={buildProps}
                                                addFieldToGroup={addFieldToGroup}
                                                addPropertyButtonLabel={addPropertyButtonLabel}
                                                areThereAnyInstances={areThereAnyInstances}
                                                isEditMode={isEditMode}
                                                initialValue={initialValues?.[propertiesType]?.find(
                                                    (property) => property.type === 'group' && property.id === item.id,
                                                )}
                                                isAccountTemplate={isAccountTemplate}
                                            />
                                        ) : (
                                            <Field
                                                field={item.data}
                                                index={index}
                                                parentId={null}
                                                onDrop={moveField}
                                                buildProps={{ ...buildProps(item.data, index) }}
                                                key={item.data.id}
                                                setFieldValue={setFieldDisplayValueWrapper(index) as FieldEditCardProps['setFieldValue']}
                                                setValues={setDisplayValueWrapper(index)}
                                                uniqueConstraints={uniqueConstraints}
                                                setUniqueConstraints={setUniqueConstraints}
                                                moveGroup={moveGroup}
                                                isAccountTemplate={isAccountTemplate}
                                                values={values}
                                            />
                                        )}
                                    </Box>
                                );
                            const { data } = item as FieldProperty;
                            return (
                                <Attachment key={data.id} field={data} index={index} buildProps={{ ...buildProps(data, index) }} onDrop={moveField} />
                            );
                        })}
                        <div>
                            {errors?.[propertiesType] === i18next.t('validation.accountBalanceField') && (
                                <div style={{ color: '#d32f2f' }}>{i18next.t('validation.accountBalanceField')}</div>
                            )}
                        </div>
                    </Grid>
                </div>
                <Grid>
                    {supportAddFieldButton && (
                        <Grid
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                paddingTop: '5px',
                            }}
                        >
                            <Button
                                style={{ margin: '8px' }}
                                type="button"
                                variant="contained"
                                onClick={() => push({ type: 'field', data: { id: uuid(), ...initialFieldCardDataOnAdd } })}
                            >
                                <Typography>{addPropertyButtonLabel}</Typography>
                            </Button>
                            {propertiesType === 'properties' && supportArchive && (
                                <Button
                                    type="button"
                                    variant="contained"
                                    style={{ margin: '8px' }}
                                    onClick={() => push({ ...initialGroupCardDataOnAdd })}
                                >
                                    <Typography>{i18next.t('wizard.entityTemplate.createGroup')}</Typography>
                                </Button>
                            )}
                        </Grid>
                    )}
                </Grid>
            </AccordionDetails>
            <AreYouSureDialog
                open={showAreUSureDialogForRemoveProperty}
                handleClose={() => setShowAreUSureDialogForRemoveProperty(false)}
                title={i18next.t('systemManagement.deleteField')}
                body={`${i18next.t('systemManagement.warningOnDeleteField')}
                                ${
                                    !!selectedIndexesToRemove.length &&
                                    getFieldData(orderedItemsRef.current, selectedIndexesToRemove[0].index, selectedIndexesToRemove[0].groupIndex)
                                        ?.title
                                }
                                ${i18next.t('systemManagement.continueWarningOnDeleteField')} ${
                                    (initialValues as unknown as IMongoEntityTemplateWithConstraintsPopulated)?.displayName
                                }`}
                onYes={() => (onDeleteSure ? onDeleteSure(setShowAreUSureDialogForRemoveProperty) : onSimpleDeleteSure())}
            />
        </FieldBlockAccordion>
    );
};

export const FieldBlock = <PropertiesType extends string, Values extends Record<PropertiesType, PropertyItem[]>>({
    propertiesType,
    values,
    uniqueConstraints,
    setUniqueConstraints,
    initialValues,
    setFieldValue,
    areThereAnyInstances,
    isEditMode,
    setBlock,
    title,
    addPropertyButtonLabel,
    touched,
    errors,
    supportSerialNumberType,
    supportUserType,
    supportEntityReferenceType,
    supportChangeToRequiredWithInstances,
    supportArrayFields,
    supportDeleteForExistingInstances,
    supportRelationshipReference,
    supportEditEnum,
    supportUnique,
    supportLocation,
    supportArchive,
    locationSearchFields,
    supportIdentifier,
    hasIdentifier,
    supportAddFieldButton = true,
    hasActions,
    draggable = { isDraggable: false },
    initialFieldCardDataOnAdd = {
        name: '',
        title: '',
        type: '',
        required: false,
        preview: false,
        hide: false,
        groupName: undefined,
        uniqueCheckbox: false,
        options: [],
        optionColors: {},
        pattern: '',
        patternCustomErrorMessage: '',
        dateNotification: undefined,
        calculateTime: undefined,
        relationshipReference: undefined,
        serialStarter: 0,
        archive: false,
        deleted: false,
        mapSearch: false,
    },
    supportConvertingToMultipleFields = true,
    supportComment,
    archive,
    onDeleteSure,
    remove,
    userPropertiesInTemplate,
}: React.PropsWithChildren<FieldBlockProps<PropertiesType, Values>>) => {
    return (
        <DndProvider backend={HTML5Backend}>
            <FieldBlockDND
                propertiesType={propertiesType}
                values={values}
                uniqueConstraints={uniqueConstraints}
                setUniqueConstraints={setUniqueConstraints}
                initialValues={initialValues}
                setFieldValue={setFieldValue}
                areThereAnyInstances={areThereAnyInstances}
                isEditMode={isEditMode}
                setBlock={setBlock}
                title={title}
                addPropertyButtonLabel={addPropertyButtonLabel}
                touched={touched}
                errors={errors}
                supportSerialNumberType={supportSerialNumberType}
                supportUserType={supportUserType}
                supportEntityReferenceType={supportEntityReferenceType}
                supportChangeToRequiredWithInstances={supportChangeToRequiredWithInstances}
                supportArrayFields={supportArrayFields}
                supportDeleteForExistingInstances={supportDeleteForExistingInstances}
                supportRelationshipReference={supportRelationshipReference}
                supportEditEnum={supportEditEnum}
                supportUnique={supportUnique}
                supportLocation={supportLocation}
                supportArchive={supportArchive}
                locationSearchFields={locationSearchFields}
                supportIdentifier={supportIdentifier}
                hasIdentifier={hasIdentifier}
                supportAddFieldButton={supportAddFieldButton ?? true}
                hasActions={hasActions}
                draggable={draggable ?? { isDraggable: false }}
                initialFieldCardDataOnAdd={
                    initialFieldCardDataOnAdd ?? {
                        name: '',
                        title: '',
                        type: '',
                        required: false,
                        preview: false,
                        hide: false,
                        groupName: undefined,
                        uniqueCheckbox: false,
                        options: [],
                        optionColors: {},
                        pattern: '',
                        patternCustomErrorMessage: '',
                        dateNotification: undefined,
                        calculateTime: undefined,
                        relationshipReference: undefined,
                        serialStarter: 0,
                        archive: false,
                        mapSearch: false,
                    }
                }
                supportConvertingToMultipleFields={supportConvertingToMultipleFields ?? true}
                supportComment={supportComment}
                archive={archive}
                onDeleteSure={onDeleteSure}
                remove={remove}
                userPropertiesInTemplate={userPropertiesInTemplate}
            />
        </DndProvider>
    );
};
