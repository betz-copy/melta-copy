import React, { SetStateAction, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Divider, Grid, IconButton, styled, TextField, Typography } from '@mui/material';
import { DraggableProvided } from 'react-beautiful-dnd';
import { v4 as uuid } from 'uuid';
import { FieldArray, FormikErrors, FormikHelpers, FormikTouched } from 'formik';
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
import { CommonFormInputProperties, FieldCommonFormInputProperties, GroupCommonFormInputProperties, PropertyItem } from './commonInterfaces';

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

export interface FieldBlockProps<PropertiesType extends string, Values extends Record<PropertiesType, CommonFormInputProperties[]>> {
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
    draggable?: { isDraggable: false } | { isDraggable: true; dragHandleProps: DraggableProvided['dragHandleProps'] };
    supportConvertingToMultipleFields?: boolean;
    supportIdentifier?: boolean;
    hasIdentifier?: boolean;
    supportComment?: boolean;
}

const Attachment = ({ field, index, buildProps, onDrop, parentId }) => {
    const ref = React.useRef(null);

    const [, drop] = useDrop({
        accept: ItemTypes.FIELD,
        hover: (item, monitor) => {
            const dragIndex = item.index;
            const hoverIndex = index;

            if (dragIndex === hoverIndex && item.parentId === parentId) return;

            onDrop(item, hoverIndex, parentId);
            item.index = hoverIndex;
            item.parentId = parentId;
        },
    });

    const [{ isDragging }, drag, preview] = useDrag({
        type: ItemTypes.FIELD,
        item: { ...field, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
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
                opacity: isDragging ? 0.5 : 1,
                alignSelf: 'stretch',
                marginBottom: '1rem',
                cursor: 'grab',
            }}
        >
            <div ref={ref} style={{ cursor: 'grab', transition: isDragging ? 'none' : 'box-shadow 0.1s ease', opacity: isDragging ? 0.5 : 1 }}>
                <MemoAttachmentEditCard {...buildProps} refDragAndDrop={ref} key={field.id} />
            </div>
        </Grid>
    );
};

const Field = ({ field, onDrop, index, parentId, buildProps, setFieldValue, setValues, uniqueConstraints, setUniqueConstraints, moveGroup }) => {
    const ref = React.useRef(null);

    const [, drop] = useDrop({
        accept: [ItemTypes.GROUP, ItemTypes.FIELD],
        hover: (item, monitor) => {
            const dragIndex = item.index;
            const hoverIndex = index;
            console.log('field', { dragIndex, hoverIndex, item });

            if (dragIndex === hoverIndex && item.parentId === parentId) return;
            console.log('field', 'after');
            if (item.type === 'group' && moveGroup) moveGroup(item, hoverIndex);
            onDrop(item, hoverIndex, parentId);
            item.index = hoverIndex;
            item.parentId = parentId;
        },
    });

    const [{ isDragging }, drag, preview] = useDrag({
        type: ItemTypes.FIELD,
        item: { ...field, index, parentId },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
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
                opacity: isDragging ? 0.5 : 1,
                alignSelf: 'stretch',
                marginBottom: '1rem',
                cursor: 'grab',
            }}
        >
            <div ref={ref} style={{ cursor: 'grab', transition: isDragging ? 'none' : 'box-shadow 0.1s ease', opacity: isDragging ? 0.5 : 1 }}>
                <MemoFieldEditCard
                    {...buildProps}
                    key={field.id}
                    setFieldValue={setFieldValue}
                    setValues={setValues}
                    uniqueConstraints={uniqueConstraints}
                    setUniqueConstraints={setUniqueConstraints}
                />
            </div>
        </Grid>
    );
};

const Group = ({
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
}) => {
    const ref = React.useRef(null);
    const [isGroupOpen, setIsGroupOpen] = useState(false);
    const [, drop] = useDrop({
        accept: [ItemTypes.GROUP, ItemTypes.FIELD],
        hover(item, monitor) {
            console.log('group', 'start', { isGroupOpen });

            if (!ref.current || !monitor.isOver({ shallow: true })) return;

            const hoverIndex = index;
            console.log('group', { hoverIndex, item });

            // Moving a group
            if (item.type === 'group') {
                const dragIndex = item.index;
                console.log('group', 'move a group', { dragIndex });
                if (dragIndex !== hoverIndex) {
                    onDrop(item, hoverIndex);
                    item.index = hoverIndex;
                }
            } else if (isGroupOpen) {
                if (group.fields.length === 0 && item.parentId !== group.id) {
                    console.log('sdsds');

                    moveField(item, 0, group.id);
                    item.index = 0;
                    item.parentId = group.id;
                } else moveField(item, hoverIndex, group.id);
            } else moveField(item, hoverIndex, null);
        },
    });

    const [{ isDragging }, drag, preview] = useDrag({
        type: ItemTypes.GROUP,
        item: { ...group, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, []);

    drag(drop(ref));

    const groupName = `properties[${index}].name`;
    const touchedName = touched?.[propertiesType]?.[index]?.name;
    const errorName = errors?.[propertiesType]?.[index]?.name;
    const displayName = `properties[${index}].displayName`;
    const touchedTitle = touched?.[propertiesType]?.[index]?.displayName;
    const errorTitle = errors?.[propertiesType]?.[index]?.displayName;

    const isNewProperty = !initialValue;
    const isDisabled = Boolean(isEditMode && !isNewProperty && areThereAnyInstances);

    const isGroupFieldBlockError = Boolean(touched?.[propertiesType]?.[index]) && Boolean(errors?.[propertiesType]?.[index]);

    return (
        <Grid
            item
            style={{
                opacity: isDragging ? 0.5 : 1,
                alignSelf: 'stretch',
                marginBottom: '1rem',
                cursor: 'grab',
            }}
        >
            <div
                ref={ref}
                style={{
                    cursor: 'grab',
                    transition: isDragging ? 'none' : 'box-shadow 0.1s ease',
                    opacity: isDragging ? 0.5 : 1,
                }}
            >
                <FieldBlockAccordion
                    sx={{
                        mb: 2,
                        padding: '0.5rem',
                        borderRadius: '12px',
                        backgroundColor: '#f4f6fa',
                        boxShadow: 'none',
                        '&:before': { display: 'none' },
                        border: isGroupFieldBlockError ? '1px solid red' : '',
                    }}
                >
                    <AccordionSummary
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
                                        backgroundColor: 'white',
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
                                        backgroundColor: 'white',
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
                        <Grid item marginBottom={2}>
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
                                    marginTop: group.fields.length === 0 ? '30px' : '',
                                    margin: '8px',
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
                        {errors?.[propertiesType]?.[index]?.fields === i18next.t('validation.oneField') && (
                            <div style={{ color: '#d32f2f' }}>{i18next.t('validation.oneField')}</div>
                        )}
                    </AccordionDetails>
                </FieldBlockAccordion>
            </div>
        </Grid>
    );
};

export const StructureEditor = <PropertiesType extends string, Values extends Record<PropertiesType, CommonFormInputProperties[]>>({
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
        mapSearch: false,
    },
    supportConvertingToMultipleFields = true,
    supportComment,
}: React.PropsWithChildren<FieldBlockProps<PropertiesType, Values>>) => {
    // copy of values of formik in order to show changes on inputs fast (formik rerenders are slow)
    const [showAreUSureDialogForRemoveProperty, setShowAreUSureDialogForRemoveProperty] = useState(false);
    // const [selectedIndexToRemove, setSelectedIndexToRemove] = useState<{ index: number; groupIndex?: number }>({
    //     index: -1,
    //     groupIndex: -1,
    // });
    const [selectedIndexesToRemove, setSelectedIndexesForRemove] = useState<{ index: number; groupIndex?: number }[]>([]);

    // using ordered item ref because update functions (push/remove/...) are not updated for the field cards on
    // every re-render and if displayValues changes, it does not update in the functions of the field cards.
    // therefore using a reference for them to always use the current orderedItems.

    const [orderedItems, setOrderedItems] = useState(values[propertiesType]);
    const orderedItemsRef = useRef(orderedItems);
    orderedItemsRef.current = orderedItems;
    console.log({ orderedItems });

    useEffect(() => {
        setFieldValue(propertiesType, orderedItems);
        console.log({ orderedItems });
    }, []);

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

    const onDeleteSure = () => {
        setShowAreUSureDialogForRemoveProperty(false);
        setFieldDisplayValue(selectedIndexesToRemove, 'deleted' as keyof Values, true);
    };
    console.log({ selectedIndexesToRemove });

    const push = (properties) => {
        const updatedItems = [...orderedItemsRef.current, properties];
        // console.log({ updatedItems });

        setOrderedItems(updatedItems);
        updateFormik();
    };

    const removeGroup = (index: number) => {
        const displayValuesCopy = [...orderedItemsRef.current];

        displayValuesCopy.splice(index, 1);

        setOrderedItems(displayValuesCopy);
        updateFormik();
    };

    const remove = (index: number, isNewProperty: Boolean, groupIndex?: number) => {
        const displayValuesCopy = [...orderedItemsRef.current];
        const isGrouped = typeof groupIndex === 'number';
        console.log({ isGrouped, index, isNewProperty, groupIndex });

        const field = isGrouped ? displayValuesCopy[groupIndex].fields[index] : displayValuesCopy[index].data;

        const isDeleted = field.deleted;

        if (isDeleted) {
            const indexesToUpdate = [{ index, groupIndex }];

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
            const indexesToUpdate = [{ index, groupIndex }];

            if (field.type === 'user') {
                const userFieldName = field.name;

                displayValuesCopy.forEach((item, idx) => {
                    if (item.type === 'group') {
                        item.fields.forEach((nestedField, nestedIndex) => {
                            if (nestedField.type === 'kartoffelUserField' && nestedField.expandedUserField?.relatedUserField === userFieldName) {
                                indexesToUpdate.push({ index: nestedIndex, groupIndex: idx });
                            }
                        });
                        console.log({ userFieldName, indexesToUpdate });
                    } else if (item.data.type === 'kartoffelUserField' && item.data.expandedUserField?.relatedUserField === userFieldName) {
                        indexesToUpdate.push({ index: idx });
                    }
                });
            }

            setShowAreUSureDialogForRemoveProperty(true);
            setSelectedIndexesForRemove(indexesToUpdate);
        } else {
            if (isGrouped) {
                const group = displayValuesCopy[groupIndex];
                if (!group || !group.fields) return;

                const removedField = group.fields[index];

                group.fields.splice(index, 1);

                // Also remove any related kartoffelUserField
                if (removedField.type === 'user') {
                    const userFieldName = removedField.name;
                    group.fields = group.fields.filter(
                        (field) => !(field.type === 'kartoffelUserField' && field.expandedUserField?.relatedUserField === userFieldName),
                    );
                }
            } else {
                const removedField = displayValuesCopy[index].data;
                displayValuesCopy.splice(index, 1);

                if (removedField.type === 'user') {
                    for (let i = displayValuesCopy.length - 1; i >= 0; i--) {
                        const item = displayValuesCopy[i];
                        if (item.data.type === 'kartoffelUserField' && item.data.expandedUserField?.relatedUserField === removedField.name) {
                            displayValuesCopy.splice(i, 1);
                        }
                    }
                }
            }

            setOrderedItems(displayValuesCopy);
            updateFormik();
        }
    };

    const setDisplayValue = (
        index: number,
        valueOrFunc: SetStateAction<FieldCommonFormInputProperties | GroupCommonFormInputProperties>,
        groupId?: string,
    ) => {
        const displayValuesCopy: any = [...orderedItemsRef.current];

        if (groupId) {
            const group = displayValuesCopy.find((val) => val.type === 'group' && val.id === groupId);
            if (!group) return;

            const updatedField = typeof valueOrFunc === 'function' ? valueOrFunc(group.fields[index]) : valueOrFunc;
            group.fields[index] = updatedField;
        } else {
            const updatedValue =
                typeof valueOrFunc === 'function' ? valueOrFunc(displayValuesCopy[index].data as FieldCommonFormInputProperties) : valueOrFunc;
            displayValuesCopy[index] = { type: 'field', data: updatedValue };
        }

        setOrderedItems(displayValuesCopy);
        updateFormik();
    };

    const onChangeGroupData = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, groupId: string) => {
        const inputName = event.target.name.split('.')[1];
        const inputValue = event.target.type === 'checkbox' && event.target instanceof HTMLInputElement ? event.target.checked : event.target.value;

        const displayValuesCopy = [...orderedItemsRef.current];

        const groupIndex = displayValuesCopy.findIndex((value) => value.type === 'group' && value.id === groupId);

        if (groupIndex === -1) return;

        const oldGroup = displayValuesCopy[groupIndex];

        const updatedGroup = {
            ...oldGroup,
            [inputName]: inputValue,
            fields: oldGroup.fields.map((field: CommonFormInputProperties) => ({
                ...field,
                fieldGroup: {
                    ...field.fieldGroup,
                    [inputName]: inputValue,
                },
            })),
        };

        displayValuesCopy[groupIndex] = updatedGroup;

        setOrderedItems(displayValuesCopy);
        updateFormik();
    };

    const onChange = (index: number, event: React.ChangeEvent<HTMLInputElement>, groupIndex?: number) => {
        const inputName = event.target.name.split('.')[1]; // the input name is in the format `properties[index].field`
        const inputValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setFieldDisplayValue([{ index, groupIndex }], inputName as keyof Values, inputValue);
        // setFieldDisplayValue([index], inputName as keyof Values, inputValue);
    };

    const onChangeWrapper = (index: number, groupIndex?: number) => (event: React.ChangeEvent<HTMLInputElement>) =>
        onChange(index, event, groupIndex);

    const setFieldDisplayValueWrapper = (index: number, groupIndex?: number) => (field: keyof Values, value: any) =>
        setFieldDisplayValue([{ index, groupIndex }], field, value);
    const setDisplayValueWrapper = (index: number, groupId?: string) => (value: SetStateAction<PropertyItem>) =>
        setDisplayValue(index, value, groupId);
    const isFieldBlockError = Boolean(touched?.[propertiesType]) && Boolean(errors?.[propertiesType]);

    const userPropertiesInTemplate = useMemo(() => {
        const userNames: string[] = [];

        values[propertiesType].forEach((item) => {
            if (item.type === 'group') {
                item.fields.forEach((field) => {
                    if (field.type === 'user' && !field.deleted) {
                        userNames.push(field.name);
                    }
                });
            } else if (item.data.type === 'user' && !item.data.deleted) {
                userNames.push(item.data.name);
            }
        });

        return userNames;
    }, [propertiesType, values]);

    const onDuplicateKartoffelField = (fieldIndex: number, groupIndex?: number) => {
        const displayValuesCopy = [...orderedItemsRef.current];

        const isGrouped = typeof groupIndex === 'number';

        const sourceField = isGrouped ? displayValuesCopy[groupIndex].fields[fieldIndex] : displayValuesCopy[fieldIndex].data;

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
            displayValuesCopy[groupIndex].fields.splice(fieldIndex + 1, 0, newField);
        } else {
            displayValuesCopy.splice(fieldIndex + 1, 0, { data: newField, type: 'field' });
        }

        setOrderedItems(displayValuesCopy);
    };

    const buildProps = (propertyProp, index: number, groupIndex?: number) => {
        const isGroup = groupIndex !== undefined;
        const currentTypeValues = initialValues?.[propertiesType]; // as ValueWrapper[] | undefined;
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

            const group = currentTypeValues?.find((item) => item.type === 'group' && item.fields?.some((f) => f.id === propertyProp.id));
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
            remove,
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
        };
    };

    const addFieldToGroup = (item) => {
        const { name, displayName, id } = item;
        const displayValuesCopy = [...orderedItemsRef.current];

        const newField = { ...initialFieldCardDataOnAdd, id: uuid(), fieldGroup: { name, displayName, id } };

        const group = displayValuesCopy.find((val) => val.type === 'group' && val.id === id);

        if (group === -1) return;

        group.fields = [...group.fields, newField];

        setOrderedItems(displayValuesCopy);

        updateFormik();
    };

    const moveGroup = (group, toIndex: number, toGroupId: string | null = null) => {
        console.log('moveGroup', 'start');

        if (toGroupId) {
            console.warn('Groups cannot be moved into other groups.');
            return;
        }

        const orderedItemsCopy = [...orderedItemsRef.current];
        const fromIndex = orderedItemsCopy.findIndex((el) => el.type === 'group' && el.id === group.id);
        if (fromIndex === -1) return;
        console.log({ fromIndex, toIndex });

        const movedGroup = orderedItemsCopy.splice(fromIndex, 1)[0];
        orderedItemsCopy.splice(toIndex, 0, movedGroup);

        console.log('moveGroup', 'end');

        setOrderedItems(orderedItemsCopy);
        updateFormik();
    };

    const moveField = (item, toIndex: number, toGroupId: string | null) => {
        // if (item.deleted) return;
        const orderedItemsCopy = [...orderedItemsRef.current];
        let movedField: any = null;
        if (item.fieldGroup) {
            console.log('moveField', 'field from a group');

            const fromGroupIndex = orderedItemsCopy.findIndex((el) => el.type === 'group' && el.id === item.fieldGroup.id);
            if (fromGroupIndex === -1) return;

            const fromGroup = orderedItemsCopy[fromGroupIndex];
            const fieldIndex = fromGroup.fields.findIndex((f) => f.id === item.id);
            if (fieldIndex === -1) return;

            // eslint-disable-next-line prefer-destructuring
            movedField = fromGroup.fields.splice(fieldIndex, 1)[0];
        } else {
            console.log('moveField', 'single field');

            const index = orderedItemsCopy.findIndex((el) => el.type === 'field' && el.data.id === item.id);
            console.log({ index, toGroupId });

            if (index === -1) return;

            movedField = orderedItemsCopy.splice(index, 1)[0].data;
        }

        if (toGroupId) {
            console.log('moveField', 'move into group');

            const toGroupIndex = orderedItemsCopy.findIndex((el) => el.type === 'group' && el.id === toGroupId);
            if (toGroupIndex === -1) return;
            const group = orderedItemsCopy[toGroupIndex];
            const { name, displayName } = group;
            group.fields.splice(toIndex, 0, {
                ...movedField,
                fieldGroup: { name, displayName, id: toGroupId },
            });
        } else {
            console.log('moveField', 'else');

            const { fieldGroup, ...movedGroupData } = movedField;
            orderedItemsCopy.splice(toIndex, 0, { type: 'field', data: movedGroupData });
        }

        setOrderedItems(orderedItemsCopy);
        updateFormik();
    };

    const [, drop] = useDrop(() => ({
        accept: [ItemTypes.FIELD, ItemTypes.GROUP],
        drop: (item: any, monitor) => {
            console.log('main', 0, { item });

            if (monitor.didDrop()) return;
            console.log('main', 1);

            // Detect if it's a group (has `fields` array) or a single field (pure property)
            const isGroup = Array.isArray(item.fields);
            console.log('main', 2, isGroup);

            // const dropIndex = orderedItems.findIndex((el) => {
            //     if (isGroup) return el.id === item.id;
            //     return el.type === 'field' && el.data.id === item.id;
            // });
            const dropIndex = item.index ?? 0;

            console.log('main', 3, dropIndex);

            // if (isGroup) {
            console.log('main', 4);
            // moveGroup(item, item.index, null);
            // item.index = hoverIndex;
            // } else {
            if (!isGroup) {
                console.log('main', 5);

                const toGroupId = null;
                moveField(item, dropIndex, toGroupId);
            }

            // }
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
                        <Box {...draggable.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', cursor: 'grab' }}>
                            <DragHandleIcon fontSize="large" />
                        </Box>
                    )}

                    <Typography>{title}</Typography>
                </Grid>
            </AccordionSummary>

            <AccordionDetails>
                <FieldArray name={propertiesType} key={propertiesType}>
                    {() => (
                        <Grid>
                            <div
                                key={propertiesType}
                                ref={drop}
                                style={{
                                    margin: 10,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minWidth: '500px',
                                }}
                            >
                                {orderedItems.map((item, index) => {
                                    if (
                                        propertiesType === 'properties' ||
                                        propertiesType === 'detailsProperties' ||
                                        propertiesType === 'archiveProperties'
                                    )
                                        return (
                                            <Box key={item.type === 'group' ? item.id : item.data.id}>
                                                {item.type === 'group' ? (
                                                    <Group
                                                        group={item}
                                                        onDrop={moveGroup}
                                                        index={index}
                                                        moveField={moveField}
                                                        errors={errors}
                                                        propertiesType={propertiesType}
                                                        touched={touched}
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
                                                        initialValue={initialValues?.[propertiesType].find((property) => property.name === item.name)}
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
                                    // return undefined;
                                    return (
                                        <Attachment
                                            key={item.data.id}
                                            field={item.data}
                                            parentId={null}
                                            index={index}
                                            buildProps={{ ...buildProps(item.data, index) }}
                                            onDrop={moveField}
                                        />
                                    );
                                })}
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
                                                <Typography>צור קבוצה</Typography>
                                            </Button>
                                        )}
                                    </Grid>
                                )}
                            </div>
                        </Grid>
                    )}
                </FieldArray>
            </AccordionDetails>
            <AreYouSureDialog
                open={showAreUSureDialogForRemoveProperty}
                handleClose={() => setShowAreUSureDialogForRemoveProperty(false)}
                title={i18next.t('systemManagement.deleteField')}
                body={`${i18next.t('systemManagement.warningOnDeleteField')}
                                ${
                                    selectedIndexesToRemove.length > 0 &&
                                    (selectedIndexesToRemove[0].groupIndex
                                        ? orderedItemsRef.current[selectedIndexesToRemove[0].groupIndex].fields?.[selectedIndexesToRemove[0]?.index]
                                              ?.title
                                        : orderedItemsRef.current[selectedIndexesToRemove[0].index]?.data?.title)
                                }
                                ${i18next.t('systemManagement.continueWarningOnDeleteField')} ${
                    (initialValues as unknown as IMongoEntityTemplatePopulated)?.displayName
                }`}
                onYes={onDeleteSure}
            />
        </FieldBlockAccordion>
    );
};

export const FieldBlock = <PropertiesType extends string, Values extends Record<PropertiesType, CommonFormInputProperties[]>>({
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
        mapSearch: false,
    },
    supportConvertingToMultipleFields = true,
    supportComment,
}: React.PropsWithChildren<FieldBlockProps<PropertiesType, Values>>) => {
    return (
        <DndProvider backend={HTML5Backend}>
            <StructureEditor
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
            />
        </DndProvider>
    );
};
