import React, { SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Divider, Grid, IconButton, styled, TextField, Typography } from '@mui/material';
import { v4 as uuid } from 'uuid';
import { FormikErrors, FormikHelpers, FormikTouched } from 'formik';
import i18next from 'i18next';
import { DragHandle as DragHandleIcon, ExpandMore as ExpandMoreIcon, Delete as DeleteIcon } from '@mui/icons-material';
import _debounce from 'lodash.debounce';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { getEmptyImage, HTML5Backend } from 'react-dnd-html5-backend';
import { FieldEditCardProps, MemoFieldEditCard } from './FieldEditCard';
import { MemoAttachmentEditCard } from './AttachmentEditCard';
import { StepComponentHelpers } from '..';
import { IUniqueConstraintOfTemplate } from '../../../interfaces/entities';
import { AreYouSureDialog } from '../../dialogs/AreYouSureDialog';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { MeltaTooltip } from '../../MeltaTooltip';
import { CommonFormInputProperties, FieldProperty, GroupProperty, PropertyItem } from './commonInterfaces';
import { useDarkModeStore } from '../../../stores/darkMode';

export const ItemTypes = {
    FIELD: 'field',
    GROUP: 'group',
    STEP: 'step',
    PROPERTY: 'property',
};

export const FieldBlockAccordion = styled(Accordion)({
    width: '100%',
    boxShadow: '1px 1px 10px 2px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
    marginBottom: '10px',
});
export interface FieldProps {
    field: CommonFormInputProperties;
    index: number;
    parentId: string | null;
    onDrop: (item: any, toIndex: number, toGroupId: string | null) => void;
    buildProps: any;
    key: string;
    setFieldValue: (field: keyof CommonFormInputProperties, value: any) => void;
    setValues: (value: SetStateAction<PropertyItem>) => void;
    uniqueConstraints?: IUniqueConstraintOfTemplate[];
    setUniqueConstraints: ((uniqueConstraints: SetStateAction<IUniqueConstraintOfTemplate[]>) => void) | undefined;
    moveGroup: (group: any, toIndex: number, toGroupId?: string | null) => void;
}
export interface GroupProps<PropertiesType extends string, Values extends Record<PropertiesType, PropertyItem[]>> {
    group: GroupProperty;
    onDrop: (group: any, toIndex: number, toGroupId?: string | null) => void;
    index: number;
    moveField: (item: any, toIndex: number, toGroupId: string | null) => void;
    touched: FormikTouched<Values> | undefined;
    errors: FormikErrors<Values> | undefined;
    propertiesType: PropertiesType;
    onChangeGroupData: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, groupId: string) => void;
    remove: (index: number) => void;
    uniqueConstraints: IUniqueConstraintOfTemplate[] | undefined;
    setUniqueConstraints: ((uniqueConstraints: SetStateAction<IUniqueConstraintOfTemplate[]>) => void) | undefined;
    setFieldDisplayValueWrapper: (index: number, groupIndex?: number) => (field: keyof Values, value: any) => void;
    setDisplayValueWrapper: (index: number, groupId?: string) => (value: SetStateAction<PropertyItem>) => void;
    buildProps: any;
    addFieldToGroup: (item: GroupProperty) => void;
    addPropertyButtonLabel: string;
    areThereAnyInstances: boolean;
    isEditMode: boolean;
    initialValue?: PropertyItem;
}

export interface AttachmentsProps {
    field: CommonFormInputProperties;
    index: number;
    buildProps: any;
    onDrop: (item: any, toIndex: number, toGroupId: string | null) => void;
}

export interface FieldBlockProps<PropertiesType extends string, Values extends Record<PropertiesType, PropertyItem[]>> {
    propertiesType: PropertiesType;
    values: Values;
    uniqueConstraints?: IUniqueConstraintOfTemplate[];
    setUniqueConstraints?: (uniqueConstraints: SetStateAction<IUniqueConstraintOfTemplate[]>) => void;
    initialValues: Values | undefined;
    setFieldValue: FormikHelpers<Values>['setFieldValue'];
    areThereAnyInstances: boolean;
    isEditMode: boolean;
    setBlock: StepComponentHelpers['setBlock'];
    title: string;
    addPropertyButtonLabel: string;
    touched: FormikTouched<Values> | undefined;
    errors: FormikErrors<Values> | undefined;
    initialFieldCardDataOnAdd?: Omit<CommonFormInputProperties, 'id'>;
    supportSerialNumberType: boolean;
    supportUserType: boolean;
    supportEntityReferenceType: boolean;
    supportChangeToRequiredWithInstances: boolean;
    supportArrayFields: boolean;
    supportDeleteForExistingInstances: boolean;
    supportRelationshipReference: boolean;
    supportEditEnum?: boolean;
    supportUnique?: boolean;
    supportLocation?: boolean;
    supportArchive?: boolean;
    locationSearchFields?: { show: boolean; disabled: boolean };
    supportAddFieldButton?: boolean;
    hasActions?: boolean;
    draggable?: { isDraggable: boolean };
    supportConvertingToMultipleFields?: boolean;
    supportIdentifier?: boolean;
    hasIdentifier?: boolean;
    supportComment?: boolean;
    userPropertiesInTemplate?: string[];
    archive?: (index: number, groupIndex?: number) => void;
    remove?: (
        index: number,
        isNewProperty: Boolean,
        propertiesType: 'properties' | 'archiveProperties' | 'attachmentProperties',
        setShowAreUSureDialogForRemoveProperty: (v: boolean) => void,
        groupIndex?: number,
    ) => void;
    onDeleteSure?: (setShowAreUSureDialogForRemoveProperty: (v: boolean) => void) => void;
}

export const getFieldData = (displayValuesCopy: any, fieldIndex: number, groupIndex?: number) => {
    if (typeof groupIndex === 'number') return (displayValuesCopy[groupIndex] as GroupProperty)?.fields?.[fieldIndex];
    return (displayValuesCopy[fieldIndex] as FieldProperty)?.data;
};

const Attachment = ({ field, index, buildProps, onDrop }: AttachmentsProps) => {
    const ref = React.useRef(null);

    const [, drop] = useDrop({
        accept: ItemTypes.FIELD,
        drop: (item: CommonFormInputProperties & { index: number }) => {
            const dragIndex = item.index;
            const hoverIndex = index;

            if (dragIndex === hoverIndex) return;

            onDrop(item, hoverIndex, null);
            // eslint-disable-next-line no-param-reassign
            item.index = hoverIndex;
        },
    });

    const [{ isDragging, opacity }, drag, preview] = useDrag({
        type: ItemTypes.FIELD,
        item: { ...field, index },
        options: {
            dropEffect: 'copy',
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
            opacity: monitor.isDragging() ? 0.5 : 1,
        }),
    });

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, []);

    drag(drop(ref));

    return (
        <Grid
            item
            style={{
                opacity,
                alignSelf: 'stretch',
                marginBottom: '1rem',
                cursor: 'grab',
            }}
        >
            <div ref={ref} style={{ cursor: 'grab', transition: isDragging ? 'none' : 'box-shadow 0.1s ease', opacity }}>
                <MemoAttachmentEditCard {...buildProps} dragRef={ref} key={field.id} />
            </div>
        </Grid>
    );
};

const Field = ({ field, onDrop, index, parentId, buildProps, setFieldValue, setValues, uniqueConstraints, setUniqueConstraints, moveGroup }) => {
    const ref = React.useRef(null);

    const [, drop] = useDrop({
        accept: [ItemTypes.GROUP, ItemTypes.FIELD],
        drop: (item: CommonFormInputProperties & { index: number; parentId: string | null }) => {
            const dragIndex = item.index;
            const hoverIndex = index;

            if (dragIndex === hoverIndex && item.parentId === parentId) return;

            if (item.type === 'group' && moveGroup) moveGroup(item, hoverIndex);

            onDrop(item, hoverIndex, parentId);

            // eslint-disable-next-line no-param-reassign
            item.index = hoverIndex;
            // eslint-disable-next-line no-param-reassign
            item.parentId = parentId;
        },
    });

    const [{ isDragging, opacity }, drag, preview] = useDrag({
        type: ItemTypes.FIELD,
        item: { ...field, index, parentId },
        options: {
            dropEffect: 'copy',
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
            opacity: monitor.isDragging() ? 0.5 : 1,
        }),
    });

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, []);

    drag(drop(ref));

    return (
        <Grid
            item
            style={{
                opacity,
                alignSelf: 'stretch',
                marginBottom: '1rem',
                cursor: 'grab',
            }}
        >
            <Grid item ref={ref} style={{ cursor: 'grab', transition: isDragging ? 'none' : 'box-shadow 0.1s ease', opacity }}>
                <MemoFieldEditCard
                    {...buildProps}
                    key={field.id}
                    setFieldValue={setFieldValue}
                    setValues={setValues}
                    uniqueConstraints={uniqueConstraints}
                    setUniqueConstraints={setUniqueConstraints}
                />
            </Grid>
        </Grid>
    );
};

const Group = <PropertiesType extends string, Values extends Record<PropertiesType, PropertyItem[]>>({
    group,
    onDrop,
    index,
    moveField,
    touched,
    errors,
    propertiesType,
    onChangeGroupData,
    remove,
    uniqueConstraints,
    setUniqueConstraints,
    setFieldDisplayValueWrapper,
    setDisplayValueWrapper,
    buildProps,
    addFieldToGroup,
    addPropertyButtonLabel,
    areThereAnyInstances,
    isEditMode,
    initialValue,
}: React.PropsWithChildren<GroupProps<PropertiesType, Values>>) => {
    const ref = React.useRef(null);
    const [isGroupOpen, setIsGroupOpen] = useState(false);
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const groupName = `properties[${index}].name`;
    const touchedName = touched?.[propertiesType]?.[index]?.name;
    const errorName = (errors?.[propertiesType]?.[index] as GroupProperty)?.name;
    const displayName = `properties[${index}].displayName`;
    const touchedTitle = touched?.[propertiesType]?.[index]?.displayName;
    const errorTitle = (errors?.[propertiesType]?.[index] as GroupProperty)?.displayName;

    const isNewProperty = !initialValue;
    const isDisabled = Boolean(isEditMode && !isNewProperty && areThereAnyInstances);

    const isGroupFieldBlockError = Boolean(touched?.[propertiesType]?.[index]) && Boolean(errors?.[propertiesType]?.[index]);
    const [isExpanded, setIsExpanded] = useState(false);

    const [, drop] = useDrop({
        accept: [ItemTypes.GROUP, ItemTypes.FIELD],
        drop(item: CommonFormInputProperties & { index: number; parentId: string | null }, monitor) {
            if (!ref.current || !monitor.isOver({ shallow: true })) return;

            const hoverIndex = index;

            if (item.type === 'group') {
                const dragIndex = item.index;
                if (dragIndex !== hoverIndex) {
                    onDrop(item, hoverIndex);
                    // eslint-disable-next-line no-param-reassign
                    item.index = hoverIndex;
                }
            } else if (isGroupOpen) {
                if (group.fields.length === 0 && item.parentId !== group.id) {
                    moveField(item, 0, group.id);

                    // eslint-disable-next-line no-param-reassign
                    item.index = 0;
                    // eslint-disable-next-line no-param-reassign
                    item.parentId = group.id;
                } else moveField(item, hoverIndex, group.id);
            } else moveField(item, hoverIndex, null);
        },
    });

    const [{ isDragging, opacity }, drag, preview] = useDrag({
        type: ItemTypes.GROUP,
        item: { ...group, index },
        options: {
            dropEffect: 'copy',
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
            opacity: monitor.isDragging() ? 0.7 : 1,
        }),
    });

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, [preview]);

    drag(drop(ref));

    return (
        <Grid
            style={{
                cursor: 'grab',
                transition: isDragging ? 'none' : 'box-shadow 0.1s ease',
                opacity,
            }}
            ref={isExpanded ? ref : undefined}
        >
            <Grid
                item
                style={{
                    opacity,
                    alignSelf: 'stretch',
                    marginBottom: '1rem',
                    cursor: 'grab',
                }}
            >
                <FieldBlockAccordion
                    sx={{
                        mb: 2,
                        padding: '0.5rem',
                        borderRadius: '12px',
                        backgroundColor: darkMode ? '#4a4a5033' : '#f4f6fa',
                        boxShadow: 'none',
                        '&:before': { display: 'none' },
                        border: isGroupFieldBlockError ? '1px solid red' : '',
                    }}
                    onChange={(_, expanded) => setIsExpanded(expanded)}
                >
                    <AccordionSummary
                        ref={!isExpanded ? ref : undefined}
                        expandIcon={<ExpandMoreIcon />}
                        onClick={() => setIsGroupOpen(!isGroupOpen)}
                        sx={{
                            '& .MuiAccordionSummary-content.Mui-expanded': {
                                margin: 0,
                            },
                            '&.Mui-focusVisible': {
                                backgroundColor: 'transparent',
                            },
                            '&:hover': {
                                backgroundColor: 'transparent',
                            },
                            '&.MuiAccordionSummary-root': {
                                backgroundColor: 'transparent',
                            },
                        }}
                    >
                        <Grid container wrap="nowrap">
                            <Box style={{ display: 'flex', alignItems: 'center' }}>
                                <DragHandleIcon fontSize="large" />
                            </Box>

                            <TextField
                                label={i18next.t('wizard.entityTemplate.groupName')}
                                id={groupName}
                                name={groupName}
                                value={group.name ?? ''}
                                onChange={(e) => onChangeGroupData(e, group.id)}
                                error={touchedName && Boolean(errorName)}
                                helperText={touchedName && errorName}
                                sx={{
                                    marginRight: '6px',
                                    '& .MuiInputBase-root': {
                                        backgroundColor: darkMode ? '' : 'white',
                                    },
                                }}
                                fullWidth
                                onClick={(e) => e.stopPropagation()}
                                disabled={isDisabled}
                            />
                            <TextField
                                label={i18next.t('wizard.entityTemplate.groupDisplayName')}
                                id={displayName}
                                name={displayName}
                                value={group.displayName ?? ''}
                                onChange={(e) => onChangeGroupData(e, group.id)}
                                error={touchedTitle && Boolean(errorTitle)}
                                helperText={touchedTitle && errorTitle}
                                sx={{
                                    marginRight: '6px',
                                    '& .MuiInputBase-root': {
                                        backgroundColor: darkMode ? '' : 'white',
                                    },
                                }}
                                fullWidth
                                onClick={(e) => e.stopPropagation()}
                            />

                            <MeltaTooltip
                                title={
                                    group.fields.length > 0
                                        ? i18next.t('wizard.entityTemplate.cantDeleteGroupWithFields')
                                        : i18next.t('wizard.entityTemplate.deleteGroup')
                                }
                            >
                                <Grid>
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            remove(index);
                                        }}
                                        disabled={group.fields.length > 0}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                            </MeltaTooltip>
                        </Grid>
                    </AccordionSummary>

                    <AccordionDetails ref={drop}>
                        <Grid item marginBottom={3}>
                            <Divider />
                        </Grid>

                        {group.fields?.map((field, idx) => (
                            <Field
                                field={field}
                                index={idx}
                                parentId={group.id}
                                onDrop={moveField}
                                buildProps={{ ...buildProps(field, idx, index) }}
                                key={field.id}
                                setFieldValue={setFieldDisplayValueWrapper(idx, index) as FieldEditCardProps['setFieldValue']}
                                setValues={setDisplayValueWrapper(idx, group.id)}
                                uniqueConstraints={uniqueConstraints}
                                setUniqueConstraints={setUniqueConstraints}
                                moveGroup={() => {}}
                            />
                        ))}

                        <Grid
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <Button
                                type="button"
                                variant="contained"
                                style={{
                                    marginTop: group.fields.length === 0 ? '30px' : '10px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                                onClick={() => {
                                    if (group.id !== '') addFieldToGroup(group);
                                }}
                            >
                                <Typography>{addPropertyButtonLabel}</Typography>
                            </Button>
                        </Grid>
                        {(errors?.[propertiesType]?.[index] as any)?.fields === i18next.t('validation.oneField') && (
                            <div style={{ color: '#d32f2f' }}>{i18next.t('validation.oneField')}</div>
                        )}
                    </AccordionDetails>
                </FieldBlockAccordion>
            </Grid>
        </Grid>
    );
};

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
    supportConvertingToMultipleFields = true,
    supportComment,
    archive,
    onDeleteSure,
    remove,
    userPropertiesInTemplate,
}: React.PropsWithChildren<FieldBlockProps<PropertiesType, Values>>) => {
    // copy of values of formik in order to show changes on inputs fast (formik rerenders are slow)
    // using ordered item ref because update functions (push/remove/...) are not updated for the field cards on
    // every re-render and if displayValues changes, it does not update in the functions of the field cards.
    // therefore using a reference for them to always use the current orderedItems.
    const [orderedItems, setOrderedItems] = useState(values[propertiesType]);

    const [showAreUSureDialogForRemoveProperty, setShowAreUSureDialogForRemoveProperty] = useState(false);
    const [selectedIndexesToRemove, setSelectedIndexesForRemove] = useState<{ index: number; groupIndex?: number }[]>([]);

    const orderedItemsRef = useRef(orderedItems);
    orderedItemsRef.current = orderedItems;

    useEffect(() => {
        setFieldValue(propertiesType, orderedItems);
    }, []);

    useEffect(() => {
        setOrderedItems(values[propertiesType]);
        orderedItemsRef.current = values[propertiesType];
    }, [values[propertiesType]]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const updateFormikDebounced = useCallback(
        _debounce(() => {
            setFieldValue(propertiesType, [...orderedItemsRef.current], true);
            setBlock(false);
        }, 1000),
        [],
    );

    const updateFormik = () => {
        setBlock(true);
        updateFormikDebounced();
    };

    const setFieldDisplayValue = (indexesToUpdate: { index: number; groupIndex?: number }[], field: keyof Values, value: any) => {
        const displayValuesCopy: any = [...orderedItemsRef.current] as Values[PropertiesType];
        indexesToUpdate.forEach(({ index, groupIndex }) => {
            if (groupIndex !== undefined) {
                const group = displayValuesCopy[groupIndex];

                if (group === -1) return;

                group.fields[index] = {
                    ...group.fields[index],
                    [field]: value,
                };

                if (field === 'name' && group.fields[index].type === 'comment')
                    group.fields[index].title = `${i18next.t('propertyTypes.comment')}-${value}`;
            } else {
                displayValuesCopy[index] = {
                    ...displayValuesCopy[index],
                    data: {
                        ...displayValuesCopy[index].data,
                        [field]: value,
                    },
                };

                if (field === 'name' && displayValuesCopy[index].data.type === 'comment')
                    displayValuesCopy[index].data.title = `${i18next.t('propertyTypes.comment')}-${value}`;
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

    const simpleRemove = (index: number, isNewProperty: Boolean, groupIndex?: number) => {
        const displayValuesCopy = [...orderedItemsRef.current] as Values[PropertiesType];
        const field = getFieldData(displayValuesCopy, index, groupIndex);

        const isDeleted = field.deleted;

        if (!isDeleted && (!areThereAnyInstances || isNewProperty)) {
            let removedField;
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
            remove(
                index,
                isNewProperty,
                propertiesType as 'properties' | 'attachmentProperties' | 'archiveProperties',
                setShowAreUSureDialogForRemoveProperty,
                groupIndex,
            );

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
                                if (nestedField.type === 'user' && nestedField.name === relatedUserFieldName && nestedField.deleted) {
                                    indexesToUpdate.push({ index: nestedIndex, groupIndex: idx });
                                }
                            });
                        } else if (item.data.type === 'user' && item.data.name === relatedUserFieldName && item.data.deleted) {
                            indexesToUpdate.push({ index: idx });
                        }
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

    const setDisplayValue = (index: number, valueOrFunc: SetStateAction<PropertyItem>, groupId?: string) => {
        const displayValuesCopy: any = [...orderedItemsRef.current] as Values[PropertiesType];

        if (groupId) {
            const group = displayValuesCopy.find((val) => val.type === 'group' && val.id === groupId);
            if (!group) return;

            const updatedField = typeof valueOrFunc === 'function' ? valueOrFunc(group.fields[index]) : valueOrFunc;
            group.fields[index] = updatedField;
        } else {
            const updatedValue = typeof valueOrFunc === 'function' ? valueOrFunc(displayValuesCopy[index].data as FieldProperty) : valueOrFunc;
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

    const setFieldDisplayValueWrapper = (index: number, groupIndex?: number) => (field: keyof Values, value: any) =>
        setFieldDisplayValue([{ index, groupIndex }], field, value);
    const setDisplayValueWrapper = (index: number, groupId?: string) => (value: SetStateAction<PropertyItem>) =>
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

    const buildProps = (propertyProp, index: number, groupIndex?: number) => {
        const isGroup = groupIndex !== undefined;
        const currentTypeValues = initialValues?.[propertiesType];
        let error;
        let touch;

        const getTouchedOrError = (obj: any) => {
            return isGroup ? obj?.[propertiesType]?.[groupIndex]?.fields?.[index] : obj?.[propertiesType]?.[index]?.data;
        };

        const findInitialValue = (): any => {
            error = getTouchedOrError(errors);
            touch = getTouchedOrError(touched);
            const directField = currentTypeValues?.find((item) => item.type === 'field' && item.data?.id === propertyProp.id);

            if (directField) return directField;

            const group = currentTypeValues?.find(
                (item) => item.type === 'group' && item.fields?.some((f) => f.id === propertyProp.id),
            ) as GroupProperty;
            if (group) {
                return {
                    data: group.fields?.find((f) => f.id === propertyProp.id),
                };
            }

            return undefined;
        };

        const initialVal = findInitialValue();

        return {
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

    const moveGroup = useCallback(
        (group, toIndex: number, toGroupId: string | null = null) => {
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
        },
        [setOrderedItems, updateFormik],
    );

    const moveField = useCallback(
        (item, toIndex: number, toGroupId: string | null) => {
            const orderedItemsCopy = [...orderedItemsRef.current] as Values[PropertiesType];
            let movedField: any = null;

            if (item.fieldGroup) {
                const fromGroupIndex = orderedItemsCopy.findIndex((el) => el.type === 'group' && el.id === item.fieldGroup.id);
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
                const { fieldGroup, ...movedGroupData } = movedField;
                orderedItemsCopy.splice(toIndex, 0, { type: 'field', data: movedGroupData });
            }

            setOrderedItems(orderedItemsCopy);
            updateFormik();
        },
        [setOrderedItems, updateFormik],
    );
    const [, drop] = useDrop(() => ({
        accept: [ItemTypes.FIELD, ItemTypes.GROUP],
        drop: (item: any, monitor) => {
            if (monitor.didDrop()) return;

            const isGroup = Array.isArray(item.fields);

            const dropIndex = item.index ?? 0;

            if (!isGroup) {
                const toGroupId = null;
                moveField(item, dropIndex, toGroupId);
            }
        },
        collect: (m) => ({
            isOver: m.isOver({ shallow: true }),
        }),
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
                <>
                    <div
                        key={propertiesType}
                        ref={drop}
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
                                    propertiesType === 'properties' ||
                                    propertiesType === 'detailsProperties' ||
                                    propertiesType === 'archiveProperties'
                                )
                                    return (
                                        <Box key={item.type === 'group' ? item.id : item.data.id} sx={{ marginBottom: 0.5 }}>
                                            {item.type === 'group' ? (
                                                <Group
                                                    group={item}
                                                    onDrop={moveGroup}
                                                    index={index}
                                                    moveField={moveField}
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
                                                />
                                            )}
                                        </Box>
                                    );
                                const { data } = item as FieldProperty;
                                return (
                                    <Attachment
                                        key={data.id}
                                        field={data}
                                        index={index}
                                        buildProps={{ ...buildProps(data, index) }}
                                        onDrop={moveField}
                                    />
                                );
                            })}
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
                                        onClick={() =>
                                            push({
                                                type: 'group',
                                                id: uuid(),
                                                name: '',
                                                displayName: '',
                                                fields: [],
                                            })
                                        }
                                    >
                                        <Typography>{i18next.t('wizard.entityTemplate.createGroup')}</Typography>
                                    </Button>
                                )}
                            </Grid>
                        )}
                    </Grid>
                </>
            </AccordionDetails>
            <AreYouSureDialog
                open={showAreUSureDialogForRemoveProperty}
                handleClose={() => setShowAreUSureDialogForRemoveProperty(false)}
                title={i18next.t('systemManagement.deleteField')}
                body={`${i18next.t('systemManagement.warningOnDeleteField')}
                                ${
                                    selectedIndexesToRemove.length > 0 &&
                                    getFieldData(orderedItemsRef.current, selectedIndexesToRemove[0].index, selectedIndexesToRemove[0].groupIndex)
                                        ?.title
                                }
                                ${i18next.t('systemManagement.continueWarningOnDeleteField')} ${
                    (initialValues as unknown as IMongoEntityTemplatePopulated)?.displayName
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
