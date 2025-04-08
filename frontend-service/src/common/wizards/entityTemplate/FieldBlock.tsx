import React, { SetStateAction, useCallback, useRef, useState } from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Grid,
    IconButton,
    styled,
    TextField,
    Typography,
} from '@mui/material';
import { DragDropContext, DraggableProvided, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuid } from 'uuid';
import { FieldArray, FormikErrors, FormikHelpers, FormikTouched } from 'formik';
import i18next from 'i18next';
import { Delete, DragHandle as DragHandleIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import _debounce from 'lodash.debounce';
import { FieldEditCardProps, MemoFieldEditCard } from './FieldEditCard';
import { MemoAttachmentEditCard } from './AttachmentEditCard';
import { StepComponentHelpers } from '..';
import { CommonFormInputProperties } from './commonInterfaces';
import { AreYouSureDialog } from '../../dialogs/AreYouSureDialog';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IUniqueConstraintOfTemplate } from '../../../interfaces/entities';

export const FieldBlockAccordion = styled(Accordion)({
    width: '100%',
    boxShadow: '1px 1px 10px 2px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
    marginBottom: '10px',
});

interface FieldBlockProps<PropertiesType extends string, Values extends Record<PropertiesType, CommonFormInputProperties[]>> {
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
}

const FieldBlock = <PropertiesType extends string, Values extends Record<PropertiesType, CommonFormInputProperties[]>>({
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
}: React.PropsWithChildren<FieldBlockProps<PropertiesType, Values>>) => {
    // copy of values of formik in order to show changes on inputs fast (formik rerenders are slow)
    const [displayValues, setDisplayValues] = React.useState(values[propertiesType]);
    // console.log({ displayValues });

    const [showAreUSureDialogForRemoveProperty, setShowAreUSureDialogForRemoveProperty] = useState(false);
    const [selectedIndexToRemove, setSelectedIndexForRemove] = useState(-1);

    // using displayValues ref because update functions (push/remove/...) are not updated for the field cards on
    // every re-render and if displayValues changes, it does not update in the functions of the field cards.
    // therefore using a reference for them to always use the current displayValues.
    const displayValuesRef = useRef(displayValues);
    displayValuesRef.current = displayValues;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const updateFormikDebounced = useCallback(
        _debounce(() => {
            setFieldValue(propertiesType, [...displayValuesRef.current], true);
            setBlock(false);
        }, 1000),
        [],
    );

    const updateFormik = () => {
        setBlock(true);
        updateFormikDebounced();
    };

    const push = (properties: CommonFormInputProperties) => {
        setDisplayValues([...displayValuesRef.current, properties] as Values[PropertiesType]);
        updateFormik();
    };

    const setFieldDisplayValue = (index: number, field: keyof Values, value: any) => {
        const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];

        displayValuesCopy[index] = { ...displayValuesCopy[index], [field]: value };

        setDisplayValues(displayValuesCopy);
        updateFormik();
    };

    const onDeleteSure = () => {
        setShowAreUSureDialogForRemoveProperty(false);
        setFieldDisplayValue(selectedIndexToRemove, 'deleted' as keyof Values, true);
    };

    const remove = (index: number, isNewProperty: Boolean) => {
        const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];
        const isDeleted = displayValuesCopy[index].deleted;

        if (isDeleted) {
            setFieldDisplayValue(index, 'deleted' as keyof Values, false);
        } else if (areThereAnyInstances && !isNewProperty) {
            setShowAreUSureDialogForRemoveProperty(true);
            setSelectedIndexForRemove(index);
        } else {
            displayValuesCopy.splice(index, 1);
            setDisplayValues(displayValuesCopy);
            updateFormik();
        }
    };

    const move = (src: number, dst: number) => {
        const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];

        displayValuesCopy.splice(dst, 0, displayValuesCopy.splice(src, 1)[0]);

        setDisplayValues(displayValuesCopy);
        updateFormik();
    };

    const setDisplayValue = (index: number, valueOrFunc: SetStateAction<CommonFormInputProperties>) => {
        const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];

        let value: CommonFormInputProperties;
        if (typeof valueOrFunc === 'function') {
            value = valueOrFunc(displayValuesCopy[index]);
        } else {
            value = valueOrFunc;
        }

        displayValuesCopy[index] = value;
        setDisplayValues(displayValuesCopy);
        updateFormik();
    };

    const onChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const inputName = event.target.name.split('.')[1]; // the input name is in the format `properties[index].field`
        const inputValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setFieldDisplayValue(index, inputName as keyof Values, inputValue);
    };
    const onChangeWrapper = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => onChange(index, event);
    const setFieldDisplayValueWrapper = (index: number) => (field: keyof Values, value: any) => setFieldDisplayValue(index, field, value);
    const setDisplayValueWrapper = (index: number) => (value: SetStateAction<CommonFormInputProperties>) => setDisplayValue(index, value);
    const isFieldBlockError = Boolean(touched?.[propertiesType]) && Boolean(errors?.[propertiesType]);

    const orderDisplayValues = () =>
        displayValues.reduce((acc: any, field) => {
            const groupName = field.fieldGroup;
            if (!groupName) {
                acc.push({ type: 'field', data: field });
            } else {
                const existingGroup = acc.find((item: any) => item.type === 'group' && item.groupName === groupName);
                if (existingGroup) {
                    existingGroup.fields.push(field);
                } else {
                    acc.push({
                        type: 'group',
                        groupName,
                        fields: [field],
                    });
                }
            }
            return acc;
        }, []);
    const [orderedItems, setOrderedItems] = useState(orderDisplayValues());
    console.log({ orderedItems });

    const orderedItemsRef = useRef(orderedItems);
    orderedItemsRef.current = orderedItems;

    const buildProps = (propertyProp, index) => ({
        entity: (values as any).displayName,
        value: propertyProp,
        index,
        isEditMode,
        initialValue: initialValues?.[propertiesType].find(({ id }) => propertyProp.id === id),
        areThereAnyInstances,
        touched: touched?.[propertiesType]?.[index],
        errors: errors?.[propertiesType]?.[index] as FormikErrors<CommonFormInputProperties> | undefined,
        remove,
        onChange: onChangeWrapper(index),
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
    });
    const addFieldToGroup = (groupName: string) => {
        const updatedItems = [...displayValues];
        const newField = { ...initialFieldCardDataOnAdd, id: uuid(), fieldGroup: groupName };
        updatedItems.push(newField);
        setDisplayValues(updatedItems as Values[PropertiesType]);
    };
    const addGroup = () => {
        const groupName = prompt('Enter group name:');
        if (groupName) {
            const newGroupField = {
                ...initialFieldCardDataOnAdd,
                id: uuid(),
                fieldGroup: groupName,
            };
            setDisplayValues([...displayValues, newGroupField] as Values[PropertiesType]);
        }
    };
    const handleEditGroupName = (oldName: string, newName: string) => {
        const updated = displayValues.map((field) => (field.fieldGroup === oldName ? { ...field, fieldGroup: newName } : field));
        setDisplayValues(updated as Values[PropertiesType]);
    };

    // Helper function to move field within the same group
    const moveWithinGroup = (sourceIndex: number, destinationIndex: number, groupName: string) => {
        const newOrderedItems = [...orderedItemsRef.current];
        const groupIndex = newOrderedItems.findIndex((item) => item.type === 'group' && `group-${item.groupName}` === groupName);
        if (groupIndex === -1) return;

        const group = newOrderedItems[groupIndex];
        const [movedField] = group.fields.splice(sourceIndex, 1);
        group.fields.splice(destinationIndex, 0, movedField);
        setOrderedItems(newOrderedItems);
        updateFormik();
    };

    // Helper function to move field from one group to another
    const moveBetweenGroups = (sourceIndex: number, destinationIndex: number, sourceGroupName: string, destinationGroupName: string) => {
        const newOrderedItems = [...orderedItemsRef.current];
        const sourceGroupIndex = newOrderedItems.findIndex((item) => `group-${item.groupName}` === sourceGroupName);
        const destinationGroupIndex = newOrderedItems.findIndex((item) => `group-${item.groupName}` === destinationGroupName);

        if (sourceGroupIndex === -1 || destinationGroupIndex === -1) return;

        const [movedField] = newOrderedItems[sourceGroupIndex].fields.splice(sourceIndex, 1);
        newOrderedItems[destinationGroupIndex].fields.splice(destinationIndex, 0, movedField);
        setOrderedItems(newOrderedItems);
        updateFormik();
    };

    // todo shirel
    const moveToGroup = (sourceIndex: number, destinationGroupName: string) => {
        const newOrderedItems = [...orderedItemsRef.current];
        const field = newOrderedItems[sourceIndex];
        const groupIndex = newOrderedItems.findIndex((item) => item.type === 'group' && `group-${item.groupName}` === destinationGroupName);
        if (groupIndex === -1) return;

        const group = newOrderedItems[groupIndex];
        group.fields.push(field.data); // Add the field to the group
        newOrderedItems.splice(sourceIndex, 1); // Remove from its current position
        setOrderedItems(newOrderedItems);
        updateFormik();
    };

    const moveGroup = (sourceIndex: number, destinationIndex: number) => {
        console.log('move group ');

        const newOrderedItems = [...orderedItemsRef.current];
        const [movedGroup] = newOrderedItems.splice(sourceIndex, 1);
        newOrderedItems.splice(destinationIndex, 0, movedGroup);
        if (!movedGroup.type) movedGroup.type = 'group';

        setOrderedItems(newOrderedItems);
        updateFormik();
    };
    return (
        <FieldBlockAccordion style={{ border: isFieldBlockError ? '1px solid red' : '' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container wrap="nowrap" alignItems="center">
                    {draggable.isDraggable && (
                        <Box {...draggable.dragHandleProps} style={{ display: 'flex', alignItems: 'center' }}>
                            <DragHandleIcon fontSize="large" />
                        </Box>
                    )}
                    <Typography>{title}</Typography>
                </Grid>
            </AccordionSummary>

            <AccordionDetails>
                <FieldArray name={propertiesType}>
                    {() => (
                        <DragDropContext
                            onDragEnd={(result) => {
                                const { source, destination } = result;
                                if (!destination) return;
                                console.log(source.droppableId, destination.droppableId);

                                // Handling case where field moves from a group to fieldArea (make it a single field)
                                if (source.droppableId !== 'fieldArea' && destination.droppableId === 'fieldArea') {
                                    const newOrderedItems = [...orderedItemsRef.current];

                                    const groupIndex = newOrderedItems.findIndex((item) => `group-${item.groupName}` === source.droppableId);
                                    if (groupIndex === -1) return;

                                    const group = newOrderedItems[groupIndex];
                                    const [movedField] = group.fields.splice(source.index, 1);
                                    newOrderedItems.push({ type: 'field', data: movedField });
                                    setOrderedItems(newOrderedItems);
                                    updateFormik();
                                }

                                // Handle moving single field into a group
                                if (source.droppableId === 'fieldArea' && destination.droppableId !== 'fieldArea') {
                                    const newOrderedItems = [...orderedItemsRef.current];
                                    const field = newOrderedItems[source.index];
                                    const groupIndex = newOrderedItems.findIndex((item) => `group-${item.groupName}` === destination.droppableId);
                                    if (groupIndex === -1) return;

                                    const group = newOrderedItems[groupIndex];
                                    group.fields.push(field.data);
                                    newOrderedItems.splice(source.index, 1);
                                    setOrderedItems(newOrderedItems);
                                    updateFormik();
                                }

                                // Case for moving field within the same group
                                if (source.droppableId === destination.droppableId && source.droppableId !== 'fieldArea') {
                                    moveWithinGroup(source.index, destination.index, source.droppableId);
                                }

                                // Case for moving field between groups
                                else if (source.droppableId !== destination.droppableId && source.droppableId !== 'fieldArea') {
                                    moveBetweenGroups(source.index, destination.index, source.droppableId, destination.droppableId);
                                }

                                // Case for moving a full group (not between groups)
                                else if (source.droppableId === 'fieldArea' && destination.droppableId === 'fieldArea') {
                                    moveGroup(source.index, destination.index);
                                }
                            }}
                        >
                            <Droppable droppableId="fieldArea" type="FIELD">
                                {(provided) => (
                                    <Box ref={provided.innerRef} {...provided.droppableProps}>
                                        {orderedItems.map((item, index) => {
                                            if (
                                                propertiesType === 'properties' ||
                                                propertiesType === 'detailsProperties' ||
                                                propertiesType === 'archiveProperties'
                                            ) {
                                                if (item.type === 'field') {
                                                    return (
                                                        <Draggable draggableId={item.data.id} index={index} key={item.data.id}>
                                                            {(dragProvided) => (
                                                                <Box
                                                                    ref={dragProvided.innerRef}
                                                                    {...dragProvided.draggableProps}
                                                                    {...dragProvided.dragHandleProps}
                                                                >
                                                                    <MemoFieldEditCard
                                                                        {...buildProps(item.data, index)}
                                                                        key={item.data.id}
                                                                        setFieldValue={
                                                                            setFieldDisplayValueWrapper(index) as FieldEditCardProps['setFieldValue']
                                                                        }
                                                                        setValues={setDisplayValueWrapper(index)}
                                                                        uniqueConstraints={uniqueConstraints}
                                                                        setUniqueConstraints={setUniqueConstraints}
                                                                    />
                                                                </Box>
                                                            )}
                                                        </Draggable>
                                                    );
                                                }
                                                if (item.type === 'group') {
                                                    return (
                                                        <Draggable draggableId={`group-${item.groupName}`} index={index} key={item.groupName}>
                                                            {(dragProvided) => (
                                                                <Box
                                                                    ref={dragProvided.innerRef}
                                                                    {...dragProvided.draggableProps}
                                                                    {...dragProvided.dragHandleProps}
                                                                    sx={{ marginTop: 2 }}
                                                                >
                                                                    <Card
                                                                        elevation={3}
                                                                        sx={{
                                                                            padding: '1.5rem',
                                                                            position: 'sticky',
                                                                            // ...(value.deleted && {
                                                                            backgroundColor: 'rgb(224, 225, 237,0.4)',
                                                                            // }),
                                                                            marginTop: 1.5,
                                                                            marginBottom: 1.5,
                                                                        }}
                                                                    >
                                                                        <Grid container wrap="nowrap">
                                                                            {draggable.isDraggable && (
                                                                                <Box
                                                                                    {...draggable.dragHandleProps}
                                                                                    style={{ display: 'flex', alignItems: 'center' }}
                                                                                >
                                                                                    <DragHandleIcon fontSize="large" />
                                                                                </Box>
                                                                            )}
                                                                            <TextField
                                                                                label={i18next.t('wizard.entityTemplate.groupName')}
                                                                                // id={name}
                                                                                // name={name}
                                                                                // value={value.name}
                                                                                // onChange={onChange}
                                                                                // error={touchedName && Boolean(errorName)}
                                                                                // helperText={touchedName && errorName}
                                                                                // disabled={isDisabled || value.deleted}
                                                                                sx={{ marginRight: '6px' }}
                                                                                fullWidth
                                                                            />
                                                                            <TextField
                                                                                label={i18next.t('wizard.entityTemplate.groupDisplayName')}
                                                                                // id={title}
                                                                                // name={title}
                                                                                // value={value.title}
                                                                                // onChange={onChange}
                                                                                // error={touchedTitle && Boolean(errorTitle)}
                                                                                // helperText={touchedTitle && errorTitle}
                                                                                sx={{ marginRight: '6px' }}
                                                                                fullWidth
                                                                                // disabled={value.deleted}
                                                                            />
                                                                        </Grid>
                                                                        <Grid marginTop={2}>
                                                                            <Divider />
                                                                        </Grid>
                                                                        <CardContent>
                                                                            <Droppable
                                                                                droppableId={`group-${item.groupName}`}
                                                                                type="FIELD"
                                                                                // isCombineEnabled
                                                                            >
                                                                                {/* type="FIELD"> */}
                                                                                {(dropProvided) => (
                                                                                    <Box ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                                                                                        {item.fields.map((field, idx) => (
                                                                                            <Draggable
                                                                                                draggableId={field.id}
                                                                                                index={idx}
                                                                                                key={field.id}
                                                                                            >
                                                                                                {(fieldProvided) => (
                                                                                                    <Box
                                                                                                        ref={fieldProvided.innerRef}
                                                                                                        {...fieldProvided.draggableProps}
                                                                                                        {...fieldProvided.dragHandleProps}
                                                                                                    >
                                                                                                        <MemoFieldEditCard
                                                                                                            {...buildProps(field, idx)}
                                                                                                            setFieldValue={
                                                                                                                setFieldDisplayValueWrapper(
                                                                                                                    idx,
                                                                                                                ) as FieldEditCardProps['setFieldValue']
                                                                                                            }
                                                                                                            setValues={setDisplayValueWrapper(idx)}
                                                                                                            uniqueConstraints={uniqueConstraints}
                                                                                                            setUniqueConstraints={
                                                                                                                setUniqueConstraints
                                                                                                            }
                                                                                                        />
                                                                                                    </Box>
                                                                                                )}
                                                                                            </Draggable>
                                                                                        ))}
                                                                                        {dropProvided.placeholder}
                                                                                        {supportAddFieldButton && (
                                                                                            <Button
                                                                                                type="button"
                                                                                                variant="contained"
                                                                                                style={{ margin: '8px' }}
                                                                                                onClick={() => addFieldToGroup(item.groupName)}
                                                                                            >
                                                                                                <Typography>{addPropertyButtonLabel}</Typography>
                                                                                            </Button>
                                                                                        )}
                                                                                    </Box>
                                                                                )}
                                                                            </Droppable>
                                                                        </CardContent>
                                                                    </Card>
                                                                </Box>
                                                            )}
                                                        </Draggable>
                                                    );
                                                }
                                            }

                                            // // eslint-disable-next-line react/jsx-key
                                            // return <MemoAttachmentEditCard {...buildProps(item.data, index)} key={item.data.id} />;
                                        })}

                                        {provided.placeholder}
                                    </Box>
                                )}
                            </Droppable>
                            {supportAddFieldButton && (
                                <Grid>
                                    <Button
                                        type="button"
                                        variant="contained"
                                        style={{ margin: '8px' }}
                                        onClick={() => push({ id: uuid(), ...initialFieldCardDataOnAdd })}
                                    >
                                        <Typography>{addPropertyButtonLabel}</Typography>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="contained"
                                        style={{ margin: '8px' }}
                                        // onClick={() => push({ id: uuid(), ...initialFieldCardDataOnAdd })}
                                    >
                                        <Typography>הוסף קבוצה</Typography>ן
                                    </Button>
                                </Grid>
                            )}

                            {/* Display error message if necessary */}
                            {errors?.[propertiesType] === i18next.t('validation.oneField') && (
                                <div style={{ color: '#d32f2f' }}>{i18next.t('validation.oneField')}</div>
                            )}
                        </DragDropContext>
                    )}
                </FieldArray>
            </AccordionDetails>
            <AreYouSureDialog
                open={showAreUSureDialogForRemoveProperty}
                handleClose={() => setShowAreUSureDialogForRemoveProperty(false)}
                title={i18next.t('systemManagement.deleteField')}
                body={`${i18next.t('systemManagement.warningOnDeleteField')}
                    ${selectedIndexToRemove > -1 && displayValuesRef.current[selectedIndexToRemove].title}
                    ${i18next.t('systemManagement.continueWarningOnDeleteField')} ${
                    (initialValues as unknown as IMongoEntityTemplatePopulated)?.displayName
                }`}
                onYes={onDeleteSure}
            />
        </FieldBlockAccordion>
    );
};

export default FieldBlock;
