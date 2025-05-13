import React, { SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
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
import {
    DragDropContext,
    DraggableProvided,
    Droppable,
    Draggable,
    DraggableLocation,
    DraggableStateSnapshot,
    DroppableProvided,
    DroppableStateSnapshot,
} from 'react-beautiful-dnd';
import { v4 as uuid } from 'uuid';
import { FieldArray, FormikErrors, FormikHelpers, FormikTouched, validateYupSchema } from 'formik';
import i18next from 'i18next';
import { DragHandle as DragHandleIcon, ExpandMore as ExpandMoreIcon, Delete as DeleteIcon } from '@mui/icons-material';
import _debounce from 'lodash.debounce';
import { FieldEditCardProps, MemoFieldEditCard } from './FieldEditCard';
import { MemoAttachmentEditCard } from './AttachmentEditCard';
import { StepComponentHelpers } from '..';
import { CommonFormInputProperties, FieldCommonFormInputProperties, GroupCommonFormInputProperties, PropertyItem } from './commonInterfaces';
import { AreYouSureDialog } from '../../dialogs/AreYouSureDialog';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IUniqueConstraintOfTemplate } from '../../../interfaces/entities';
import { MeltaTooltip } from '../../MeltaTooltip';

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

// const XX = ({ item, buildProps, setFieldDisplayValueWrapper, setDisplayValueWrapper, uniqueConstraints, setUniqueConstraints, index }) => {
//     return (
//         <Droppable droppableId={`group-${item.name}`} key={`group-${item.name}`} type="field">
//             {(dropProvided, dropSnapshot) => (
//                 <Box
//                     ref={dropProvided.innerRef}
//                     {...dropProvided.droppableProps}
//                     sx={{
//                         paddingTop: 2,
//                         minHeight: 200,
//                         backgroundColor: dropSnapshot.isDraggingOver ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
//                         border: '1px dashed lightgray',
//                         transition: 'background-color 0.2s ease',
//                     }}
//                 >
//                     {/* <Grid marginTop={2}>
//                     <Divider />
//                 </Grid> */}
//                     {/* <CardContent> */}

//                     {item.fields && item.fields.length === 0 ? (
//                         // <Grid>
//                         //     <Typography sx={{ padding: 2, color: 'gray' }}>{i18next.t('wizard.entityTemplate.dropFielde')}</Typography>
//                         // </Grid>
//                         <Draggable draggableId={`child-${item.name}`} index={111 + index} key={`child-${item.name}`}>
//                             {(fieldProvided) => (
//                                 <Box ref={fieldProvided.innerRef} {...fieldProvided.draggableProps} {...fieldProvided.dragHandleProps}>
//                                     {item.name}
//                                 </Box>
//                             )}
//                         </Draggable>
//                     ) : (
//                         item.fields?.map((field, fieldIndx) => (
//                             // <Draggable draggableId={`field-${field.id}`} index={fieldIndx} key={field.id}>
//                             //     {(fieldProvided) => (
//                             // <Box ref={fieldProvided.innerRef} {...fieldProvided.draggableProps} {...fieldProvided.dragHandleProps}>
//                             // eslint-disable-next-line react/jsx-key
//                             <MemoFieldEditCard
//                                 {...buildProps(field, fieldIndx, index)}
//                                 setFieldValue={setFieldDisplayValueWrapper(fieldIndx, index) as FieldEditCardProps['setFieldValue']}
//                                 setValues={setDisplayValueWrapper(fieldIndx, item.name)}
//                                 uniqueConstraints={uniqueConstraints}
//                                 setUniqueConstraints={setUniqueConstraints}
//                             />
//                         ))
//                     )}
//                     {/* )} */}

//                     {dropProvided.placeholder}

//                     {/* {supportAddFieldButton && ( */}
//                     <Grid
//                         sx={{
//                             display: 'flex',
//                             justifyContent: 'center',
//                         }}
//                     >
//                         <Button
//                             type="button"
//                             variant="contained"
//                             style={{
//                                 margin: '8px',
//                                 display: 'flex',
//                                 justifyContent: 'center',
//                             }}
//                             onClick={() => {
//                                 if (item.name !== '') addFieldToGroup(item);
//                             }}
//                         >
//                             add
//                             {/* <Typography>{addPropertyButtonLabel()}</Typography> */}
//                         </Button>
//                     </Grid>
//                     {/* )}
//                         {/* {errors?.[propertiesType]?.[index]?.fields ===
//                     i18next.t('validation.oneField') && (
//                     <div style={{ color: '#d32f2f' }}>
//                         {i18next.t('validation.oneField')}
//                     </div> */}
//                     {/* )} */}
//                 </Box>
//             )}
//         </Droppable>
//     );
// };

// const FieldBlock = <PropertiesType extends string, Values extends Record<PropertiesType, CommonFormInputProperties[]>>({
//     propertiesType,
//     values,
//     uniqueConstraints,
//     setUniqueConstraints,
//     initialValues,
//     setFieldValue,
//     areThereAnyInstances,
//     isEditMode,
//     setBlock,
//     title,
//     addPropertyButtonLabel,
//     touched,
//     errors,
//     supportSerialNumberType,
//     supportUserType,
//     supportEntityReferenceType,
//     supportChangeToRequiredWithInstances,
//     supportArrayFields,
//     supportDeleteForExistingInstances,
//     supportRelationshipReference,
//     supportEditEnum,
//     supportUnique,
//     supportLocation,
//     supportArchive,
//     locationSearchFields,
//     supportIdentifier,
//     hasIdentifier,
//     supportAddFieldButton = true,
//     hasActions,
//     draggable = { isDraggable: false },
//     initialFieldCardDataOnAdd = {
//         name: '',
//         title: '',
//         type: '',
//         required: false,
//         preview: false,
//         hide: false,
//         groupName: undefined,
//         uniqueCheckbox: false,
//         options: [],
//         optionColors: {},
//         pattern: '',
//         patternCustomErrorMessage: '',
//         dateNotification: undefined,
//         calculateTime: undefined,
//         relationshipReference: undefined,
//         expandedUserField: undefined,
//         serialStarter: 0,
//         archive: false,
//         mapSearch: false,
//     },
//     supportConvertingToMultipleFields = true,
//     supportComment,
// }: React.PropsWithChildren<FieldBlockProps<PropertiesType, Values>>) => {
//     // copy of values of formik in order to show changes on inputs fast (formik rerenders are slow)
//     // console.log('im back', values[propertiesType]);

//     const [showAreUSureDialogForRemoveProperty, setShowAreUSureDialogForRemoveProperty] = useState(false);
//     const [selectedIndexToRemove, setSelectedIndexToRemove] = useState<{ index: number; groupIndex?: number }>({
//         index: -1,
//         groupIndex: -1,
//     });

//     // using ordered item ref because update functions (push/remove/...) are not updated for the field cards on
//     // every re-render and if displayValues changes, it does not update in the functions of the field cards.
//     // therefore using a reference for them to always use the current orderedItems.
//     const [orderedItems, setOrderedItems] = useState(values[propertiesType]);

//     console.log({ orderedItems, errors });

//     const orderedItemsRef = useRef(orderedItems);
//     orderedItemsRef.current = orderedItems;

//     useEffect(() => {
//         // console.log('importent!!!', orderedItems, propertiesType);

//         setFieldValue(propertiesType, orderedItems);
//     }, []);

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     const updateFormikDebounced = useCallback(
//         _debounce(() => {
//             setFieldValue(propertiesType, [...orderedItemsRef.current], true);
//             setBlock(false);
//         }, 1000),
//         [],
//     );

//     const updateFormik = () => {
//         setBlock(true);
//         updateFormikDebounced();
//     };

//     const push = (properties) => {
//         const updatedItems = [...orderedItemsRef.current, properties];
//         // console.log({ updatedItems });

//         setOrderedItems(updatedItems);
//         updateFormik();
//     };

//     const setFieldDisplayValue = (index: number, field: keyof Values, value: any, groupIndex?: number) => {
//         const displayValuesCopy: any = [...orderedItemsRef.current] as Values[PropertiesType];

//         if (groupIndex !== undefined) {
//             const group = displayValuesCopy[groupIndex];
//             console.log({ displayValuesCopy });

//             if (group === -1) return;

//             group.fields[index] = {
//                 ...group.fields[index],
//                 [field]: value
//             }

//             if (field === 'name' && group.fields[index].type === 'comment')
//                 group.fields[index].title = `${i18next.t('propertyTypes.comment')}-${value}`;

//         } else {
//             console.log('in else', { field, value }, index);

//             displayValuesCopy[index] = {
//                 ...displayValuesCopy[index],
//                 data: {
//                     ...displayValuesCopy[index].data,
//                     [field]: value,
//                 },
//             };

//             if (field === 'name' && displayValuesCopy[index].data.type === 'comment')
//                 displayValuesCopy[index].data.title = `${i18next.t('propertyTypes.comment')}-${value}`;
//         }
//         setOrderedItems(displayValuesCopy);
//         updateFormik();
//     };

//     const onDeleteSure = () => {
//         setShowAreUSureDialogForRemoveProperty(false);
//         setFieldDisplayValue(selectedIndexToRemove.index, 'deleted' as keyof Values, true, selectedIndexToRemove.groupIndex);
//     };

//     const remove = (index: number, isNewProperty: Boolean, groupIndex?: number) => {
//         const displayValuesCopy = [...orderedItemsRef.current];
//         const isGrouped = typeof groupIndex === 'number';
//         const field = isGrouped
//             ? displayValuesCopy[groupIndex].fields[index]
//             : displayValuesCopy[index].data;

//         const isDeleted = field.deleted;

//         if (isDeleted) {
//             const indexesToUpdate = [{ index, groupIndex }];

//             if (field.type === 'kartoffelUserField') {
//                 const relatedUserFieldName = field.expandedUserField?.relatedUserField;

//                 if (relatedUserFieldName) {
//                     displayValuesCopy.forEach((item, idx) => {
//                         if (item.type === 'group') {
//                             item.fields.forEach((nestedField, nestedIndex) => {
//                                 if (
//                                     nestedField.type === 'user' &&
//                                     nestedField.name === relatedUserFieldName &&
//                                     nestedField.deleted
//                                 ) {
//                                     indexesToUpdate.push({ index: nestedIndex, groupIndex: idx });
//                                 }
//                             });
//                         } else if (
//                             item.data.type === 'user' &&
//                             item.data.name === relatedUserFieldName &&
//                             item.data.deleted
//                         ) {
//                             indexesToUpdate.push({ index: idx });
//                         }
//                     });
//                 }
//             }

//             // Restore the fields
//             indexesToUpdate.forEach(({ index, groupIndex }) => {
//                 setFieldDisplayValue(index, 'deleted' as keyof Values, false, groupIndex);
//             });
//         } else if (areThereAnyInstances && !isNewProperty) {
//             const indexesToUpdate = [{ index, groupIndex }];

//             if (field.type === 'user') {
//                 const userFieldName = field.name;

//                 displayValuesCopy.forEach((item, idx) => {
//                     if (item.type === 'group') {
//                         item.fields.forEach((nestedField, nestedIndex) => {
//                             if (
//                                 nestedField.type === 'kartoffelUserField' &&
//                                 nestedField.expandedUserField?.relatedUserField === userFieldName
//                             ) {
//                                 indexesToUpdate.push({ index: nestedIndex, groupIndex: idx });
//                             }
//                         });
//                     } else if (
//                         item.data.type === 'kartoffelUserField' &&
//                         item.data.expandedUserField?.relatedUserField === userFieldName
//                     ) {
//                         indexesToUpdate.push({ index: idx });
//                     }
//                 });
//             }

//             setShowAreUSureDialogForRemoveProperty(true);
//             setSelectedIndexToRemove(indexesToUpdate[0]); // your logic supports 1 index for now
//         } else {
//             // Remove directly
//             if (isGrouped) {
//                 const group = displayValuesCopy[groupIndex];
//                 if (!group || !group.fields) return;

//                 const removedField = group.fields[index];

//                 group.fields.splice(index, 1);

//                 // Also remove any related kartoffelUserField
//                 if (removedField.type === 'user') {
//                     const userFieldName = removedField.name;
//                     group.fields = group.fields.filter(
//                         (field) =>
//                             !(
//                                 field.type === 'kartoffelUserField' &&
//                                 field.expandedUserField?.relatedUserField === userFieldName
//                             )
//                     );
//                 }
//             } else {
//                 const removedField = displayValuesCopy[index].data;
//                 displayValuesCopy.splice(index, 1);

//                 if (removedField.type === 'user') {
//                     for (let i = displayValuesCopy.length - 1; i >= 0; i--) {
//                         const item = displayValuesCopy[i];
//                         if (
//                             item.data.type === 'kartoffelUserField' &&
//                             item.data.expandedUserField?.relatedUserField === removedField.name
//                         ) {
//                             displayValuesCopy.splice(i, 1);
//                         }
//                     }
//                 }
//             }

//             setOrderedItems(displayValuesCopy);
//             updateFormik();
//         }
//     };

//     const setDisplayValue = (
//         index: number,
//         valueOrFunc: SetStateAction<FieldCommonFormInputProperties | GroupCommonFormInputProperties>,
//         groupName?: string,
//     ) => {
//         const displayValuesCopy: any = [...orderedItemsRef.current] as FieldCommonFormInputProperties[];

//         if (groupName) {
//             const group = displayValuesCopy.find((val) => val.type === 'group' && val.name === groupName);
//             if (!group) return;

//             const updatedField = typeof valueOrFunc === 'function' ? valueOrFunc(group.fields[index]) : valueOrFunc;
//             group.fields[index] = updatedField;
//         } else {
//             const updatedValue =
//             typeof valueOrFunc === 'function' ? valueOrFunc(displayValuesCopy[index] as FieldCommonFormInputProperties) : valueOrFunc;
//             displayValuesCopy[index] = updatedValue;
//         }
//         setOrderedItems(displayValuesCopy);
//         updateFormik();
//     };

//     const onChangeGroupData = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, groupName: string) => {
//         const inputName = event.target.name.split('.')[1];
//         const inputValue = event.target.type === 'checkbox' && event.target instanceof HTMLInputElement ? event.target.checked : event.target.value;

//         const displayValuesCopy = [...orderedItemsRef.current];

//         const groupIndex = displayValuesCopy.findIndex((value) => value.type === 'group' && value.name === groupName);

//         if (groupIndex === -1) return;

//         const oldGroup = displayValuesCopy[groupIndex];

//         const updatedGroup = {
//             ...oldGroup,
//             [inputName]: inputValue,
//             fields: oldGroup.fields.map((field: CommonFormInputProperties) => ({
//                 ...field,
//                 fieldGroup: {
//                     ...field.fieldGroup,
//                     [inputName]: inputValue,
//                 },
//             })),
//         };

//         displayValuesCopy[groupIndex] = updatedGroup;

//         setOrderedItems(displayValuesCopy);
//         updateFormik();
//     };
//     const buildProps = (propertyProp, index: number, groupIndex?: number) => {
//         const isGroup = groupIndex !== undefined;
//         const currentTypeValues = initialValues?.[propertiesType]; // as ValueWrapper[] | undefined;
//         let error;
//         let touch;

//         const getTouchedOrError = (obj: any) => {
//             return isGroup ? obj?.[propertiesType]?.[groupIndex]?.fields?.[index] : obj?.[propertiesType]?.[index]?.data;
//         };
//         console.log({ errors }); // , getTouchedOrError: getTouchedOrError(errors) });

//         const findInitialValue = (): any => {
//             // if (propertiesType === 'properties' || propertiesType === 'detailsProperties' || propertiesType === 'archiveProperties') {
//             error = getTouchedOrError(errors);
//             touch = getTouchedOrError(touched);
//             const directField = currentTypeValues?.find((item) => item.type === 'field' && item.data?.id === propertyProp.id);
//             if (directField) return directField;

//             const group = currentTypeValues?.find((item) => item.type === 'group' && item.fields?.some((f) => f.id === propertyProp.id));
//             if (group) {
//                 return {
//                     data: group.fields?.find((f) => f.id === propertyProp.id),
//                 };
//             }

//             return undefined;
//         };

//         const initialVal = findInitialValue();

//         return {
//             entity: (values as any).displayName,
//             value: propertyProp,
//             index,
//             isEditMode,
//             initialValue: initialVal?.data,
//             areThereAnyInstances,
//             touched: touch,
//             errors: error,
//             remove,
//             onChange: onChangeWrapper(index, groupIndex),
//             supportSerialNumberType,
//             supportUserType,
//             supportEntityReferenceType,
//             supportChangeToRequiredWithInstances,
//             templateId: (values as any)._id,
//             supportArrayFields,
//             supportDeleteForExistingInstances,
//             supportEditEnum,
//             supportRelationshipReference,
//             supportUnique,
//             supportLocation,
//             supportArchive,
//             supportIdentifier,
//             hasIdentifier,
//             locationSearchFields,
//             hasActions,
//             supportConvertingToMultipleFields,
//             groupIndex,
//             userPropertiesInTemplate,
//             onDuplicateKartoffelField,
//             supportComment,
//         };
//     };

//     const addFieldToGroup = (item) => {
//         const { name, displayName } = item;
//         const displayValuesCopy = [...orderedItemsRef.current];
//         const newField = { ...initialFieldCardDataOnAdd, id: uuid(), fieldGroup: { name, displayName } };
//         const group = displayValuesCopy.find((val) => val.type === 'group' && val.name === name);

//         if (group === -1) return;

//         group.fields = [...group.fields, newField];

//         setOrderedItems(displayValuesCopy);
//         updateFormik();
//     };

//     const onChange = (index: number, event: React.ChangeEvent<HTMLInputElement>, groupIndex?: number) => {
//         const inputName = event.target.name.split('.')[1]; // the input name is in the format `properties[index].field`
//         const inputValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
//         setFieldDisplayValue(index, inputName as keyof Values, inputValue, groupIndex);
//         // setFieldDisplayValue([index], inputName as keyof Values, inputValue);

//     };

//     const onChangeWrapper = (index: number, groupIndex?: number) => (event: React.ChangeEvent<HTMLInputElement>) =>
//         onChange(index, event, groupIndex);

//     const setFieldDisplayValueWrapper = (index: number, groupIndex?: number) => (field: keyof Values, value: any) =>
//         setFieldDisplayValue(index, field, value, groupIndex);
//     const setDisplayValueWrapper = (index: number, groupName?: string) => (value: SetStateAction<PropertyItem>) =>
//         setDisplayValue(index, value, groupName);
//     const isFieldBlockError = Boolean(touched?.[propertiesType]) && Boolean(errors?.[propertiesType]);

//     const userPropertiesInTemplate = useMemo(
//         () => values[propertiesType].filter(({ type, deleted }) => type === 'user' && !deleted).map(({ name }) => name),
//         [propertiesType, values],
//     );

//     const onDuplicateKartoffelField = (fieldIndex: number) => {
//         const displayValuesCopy = [...orderedItemsRef.current] as Values[PropertiesType];
//         displayValuesCopy.splice(fieldIndex + 1, 0, {
//             id: uuid(),
//             ...initialFieldCardDataOnAdd,
//             type: 'kartoffelUserField',
//             readOnly: true,
//             expandedUserField: {
//                 relatedUserField: displayValues[fieldIndex].expandedUserField?.relatedUserField || '',
//                 kartoffelField: '',
//             },
//         });
//         setOrderedItems(displayValuesCopy)
//     };

//     return (
//         <FieldBlockAccordion style={{ border: isFieldBlockError ? '1px solid red' : '' }}>
//             <AccordionSummary expandIcon={<ExpandMoreIcon />}>
//                 <Grid container wrap="nowrap" alignItems="center">
//                     {draggable.isDraggable && (
//                         <Box {...draggable.dragHandleProps} style={{ display: 'flex', alignItems: 'center' }}>
//                             <DragHandleIcon fontSize="large" />
//                         </Box>
//                     )}
//                     <Typography>{title}</Typography>
//                 </Grid>
//             </AccordionSummary>

//             <AccordionDetails>
//                 <FieldArray name={propertiesType}>
//                     {() => (
// <<<<<<< HEAD
//                         <DragDropContext
//                             onDragEnd={(result) => {
//                                 const { source, destination, draggableId } = result;
//                                 if (!destination) return;
// =======
//                         <DragDropContext onDragEnd={(result) => result.destination && move(result.source.index, result.destination.index)}>
//                             <Droppable droppableId="fieldArea">
//                                 {(droppableProvided) => (
//                                     <Grid
//                                         container
//                                         ref={droppableProvided.innerRef}
//                                         {...droppableProvided.droppableProps}
//                                         direction="column"
//                                         alignItems="center"
//                                     >
//                                         {displayValues.map((property, index) => {
//                                             const props = {
//                                                 entity: (values as any).displayName,
//                                                 value: property,
//                                                 index,
//                                                 isEditMode,
//                                                 initialValue: initialValues?.[propertiesType].find(({ id }) => property.id === id),
//                                                 areThereAnyInstances,
//                                                 touched: touched?.[propertiesType]?.[index],
//                                                 errors: errors?.[propertiesType]?.[index] as FormikErrors<CommonFormInputProperties> | undefined,
//                                                 remove,
//                                                 onChange: onChangeWrapper(index),
//                                                 supportSerialNumberType,
//                                                 supportUserType,
//                                                 supportEntityReferenceType,
//                                                 supportChangeToRequiredWithInstances,
//                                                 templateId: (values as any)._id,
//                                                 supportArrayFields,
//                                                 supportDeleteForExistingInstances,
//                                                 supportEditEnum,
//                                                 supportRelationshipReference,
//                                                 supportUnique,
//                                                 supportLocation,
//                                                 supportArchive,
//                                                 supportIdentifier,
//                                                 hasIdentifier,
//                                                 locationSearchFields,
//                                                 hasActions,
//                                                 supportConvertingToMultipleFields,
//                                                 supportComment,
//                                                 userPropertiesInTemplate,
//                                                 onDuplicateKartoffelField,
//                                             };
// >>>>>>> a0754cffa408b4c1120baac959b67c175b0bbb29

//                                 const sourceDroppableId = source.droppableId;
//                                 const destDroppableId = destination.droppableId;

//                                 const sourceIsGroup = sourceDroppableId.startsWith('group-');
//                                 const destIsGroup = destDroppableId.startsWith('group-');
//                                 const draggingIsGroup = draggableId.startsWith('group-');

//                                 // Moving from group to field area
//                                 if (sourceIsGroup && destDroppableId === 'fieldArea') {
//                                     console.log('helooo', 1);

//                                     moveFromGroup(source, destination);
//                                 }
//                                 // Moving from field area into group
//                                 else if (sourceDroppableId === 'fieldArea' && destIsGroup) {
//                                     console.log('helooo', 2);

//                                     moveIntoGroup(source, destination);
//                                 }
//                                 // Moving inside the same group
//                                 else if (sourceIsGroup && destIsGroup && sourceDroppableId === destDroppableId) {
//                                     console.log('helooo', 3);

//                                     moveWithinGroup(source.index, destination.index, sourceDroppableId);
//                                 }
//                                 // Moving between groups
//                                 else if (sourceIsGroup && destIsGroup && sourceDroppableId !== destDroppableId) {
//                                     console.log('helooo', 4);

//                                     moveBetweenGroups(source.index, destination.index, sourceDroppableId, destDroppableId);
//                                 }
//                                 // Moving groups inside field area or move fields in field area
//                                 else if (sourceDroppableId === 'fieldArea' && destDroppableId === 'fieldArea') {
//                                     console.log('helooo', 5);

//                                     moveFullGroupOrField(source.index, destination.index);
//                                 }
//                             }}
//                         >
//                             <Droppable droppableId="fieldArea" type="field">
//                                 {(provided) => (
//                                     <Box ref={provided.innerRef} {...provided.droppableProps}>
//                                         {orderedItems.map((item, index) => {
//                                             if (
//                                                 propertiesType === 'properties' ||
//                                                 propertiesType === 'detailsProperties' ||
//                                                 propertiesType === 'archiveProperties'
//                                             ) {
//                                                 if (item.type === 'field') {
//                                                     return (
//                                                         <MemoFieldEditCard
//                                                             {...buildProps(item.data, index)}
//                                                             key={item.data.id}
//                                                             setFieldValue={setFieldDisplayValueWrapper(index) as FieldEditCardProps['setFieldValue']}
//                                                             setValues={setDisplayValueWrapper(index)}
//                                                             uniqueConstraints={uniqueConstraints}
//                                                             setUniqueConstraints={setUniqueConstraints}
//                                                         />
//                                                     );
//                                                 }
//                                                 if (item.type === 'group') {
//                                                     const groupName = `properties[${index}].name`;
//                                                     const touchedName = touched?.[propertiesType]?.[index]?.name;
//                                                     const errorName = errors?.[propertiesType]?.[index]?.name;
//                                                     const displayName = `properties[${index}].displayName`;
//                                                     const touchedTitle = touched?.[propertiesType]?.[index]?.displayName;
//                                                     const errorTitle = errors?.[propertiesType]?.[index]?.displayName;
//                                                     return (
//                                                         <Draggable draggableId={`group-${item.name}`} index={index} key={`group-${item.name}`}>
//                                                             {(dragProvided) => (
//                                                                 <Box
//                                                                     ref={dragProvided.innerRef}
//                                                                     {...dragProvided.draggableProps}
//                                                                     {...dragProvided.dragHandleProps}
//                                                                     sx={{ marginTop: 2 }}
//                                                                 >
//                                                                     <FieldBlockAccordion
//                                                                         // elevation={3}
//                                                                         sx={{
//                                                                             padding: '0.5rem',
//                                                                             backgroundColor: 'rgb(224, 225, 237,0.4)',
//                                                                             marginTop: 1.5,
//                                                                             marginBottom: 1.5,
//                                                                         }}
//                                                                     >
//                                                                         <AccordionSummary expandIcon={<ExpandMoreIcon />}>
//                                                                             <Grid container wrap="nowrap">
//                                                                                 {/* {draggable.isDraggable && (
//                                                                                     <Box
//                                                                                         {...draggable.dragHandleProps}
//                                                                                         style={{ display: 'flex', alignItems: 'center' }}
//                                                                                     >
//                                                                                         <DragHandleIcon fontSize="large" />
//                                                                                     </Box>
//                                                                                 )} */}
//                                                                                 <TextField
//                                                                                     label={i18next.t('wizard.entityTemplate.groupName')}
//                                                                                     id={groupName}
//                                                                                     name={groupName}
//                                                                                     value={item.name ?? ''}
//                                                                                     onChange={(e) => onChangeGroupData(e, item.name)}
//                                                                                     error={touchedName && Boolean(errorName)}
//                                                                                     helperText={touchedName && errorName}
//                                                                                     sx={{ marginRight: '6px' }}
//                                                                                     fullWidth
//                                                                                     onClick={(e) => e.stopPropagation()}
//                                                                                 />
//                                                                                 <TextField
//                                                                                     label={i18next.t('wizard.entityTemplate.groupDisplayName')}
//                                                                                     id={displayName}
//                                                                                     name={displayName}
//                                                                                     value={item.displayName ?? ''}
//                                                                                     onChange={(e) => onChangeGroupData(e, item.name)}
//                                                                                     error={touchedTitle && Boolean(errorTitle)}
//                                                                                     helperText={touchedTitle && errorTitle}
//                                                                                     sx={{ marginRight: '6px' }}
//                                                                                     fullWidth
//                                                                                     onClick={(e) => e.stopPropagation()}
//                                                                                 />

//                                                                                 <MeltaTooltip
//                                                                                     title={
//                                                                                         item.fields.length > 0
//                                                                                             ? i18next.t(
//                                                                                                   'wizard.entityTemplate.cantDeleteGroupWithFields',
//                                                                                               )
//                                                                                             : i18next.t('wizard.entityTemplate.deleteGroup')
//                                                                                     }
//                                                                                 >
//                                                                                     <Grid>
//                                                                                         <IconButton
//                                                                                             onClick={() => remove(index, true)}
//                                                                                             disabled={item.fields.length > 0}
//                                                                                         >
//                                                                                             <DeleteIcon />
//                                                                                         </IconButton>
//                                                                                     </Grid>
//                                                                                 </MeltaTooltip>
//                                                                             </Grid>
//                                                                         </AccordionSummary>

//                                                                         <AccordionDetails>
//                                                                             <XX
//                                                                                 buildProps={buildProps}
//                                                                                 item={item}
//                                                                                 setDisplayValueWrapper={setDisplayValueWrapper}
//                                                                                 setFieldDisplayValueWrapper={setFieldDisplayValueWrapper}
//                                                                                 setUniqueConstraints={setUniqueConstraints}
//                                                                                 uniqueConstraints={uniqueConstraints}
//                                                                                 index={index}
//                                                                             />
//                                                                         </AccordionDetails>
//                                                                     </FieldBlockAccordion>
//                                                                 </Box>
//                                                             )}
//                                                         </Draggable>
//                                                     );
//                                                 }
//                                             }

//                                             // // eslint-disable-next-line react/jsx-key
//                                             return <MemoAttachmentEditCard {...buildProps(item.data, index)} key={item.id} />;
//                                         })}

//                                         {provided.placeholder}
//                                     </Box>
//                                 )}
//                             </Droppable>
//                             {supportAddFieldButton && (
//                                 <Grid>
//                                     <Button
//                                         type="button"
//                                         variant="contained"
//                                         style={{ margin: '8px' }}
//                                         onClick={() => push({ type: 'field', data: { id: uuid(), ...initialFieldCardDataOnAdd } })}
//                                     >
//                                         <Typography>{addPropertyButtonLabel}</Typography>
//                                     </Button>
//                                     {(propertiesType === 'properties' ||
//                                         propertiesType === 'detailsProperties' ||
//                                         propertiesType === 'archiveProperties') && (
//                                         <Button
//                                             type="button"
//                                             variant="contained"
//                                             style={{ margin: '8px' }}
//                                             onClick={() =>
//                                                 push({
//                                                     type: 'group',
//                                                     name: uuid(),
//                                                     displayName: '',
//                                                     fields: [],
//                                                 })
//                                             }
//                                         >
//                                             <Typography>צור קבוצה</Typography>
//                                         </Button>
//                                     )}
//                                 </Grid>
//                             )}
//                             {/* Display error message if necessary */}
//                             {errors?.[propertiesType] === i18next.t('validation.oneField') && (
//                                 <div style={{ color: '#d32f2f' }}>{i18next.t('validation.oneField')}</div>
//                             )}
//                         </DragDropContext>
//                     )}
//                 </FieldArray>
//             </AccordionDetails>
//             <AreYouSureDialog
//                 open={showAreUSureDialogForRemoveProperty}
//                 handleClose={() => setShowAreUSureDialogForRemoveProperty(false)}
//                 title={i18next.t('systemManagement.deleteField')}
//                 body={`${i18next.t('systemManagement.warningOnDeleteField')}
// <<<<<<< HEAD
//                     ${
//                         selectedIndexToRemove.index > -1 &&
//                         (selectedIndexToRemove.groupIndex
//                             ? orderedItemsRef.current[selectedIndexToRemove.groupIndex].fields[selectedIndexToRemove.index].title
//                             : orderedItemsRef.current[selectedIndexToRemove.index].data.title)
//                     }
// =======
//                     ${selectedIndexesToRemove.length > 0 && displayValuesRef.current[selectedIndexesToRemove[0]].title}
// >>>>>>> a0754cffa408b4c1120baac959b67c175b0bbb29
//                     ${i18next.t('systemManagement.continueWarningOnDeleteField')} ${
//                     (initialValues as unknown as IMongoEntityTemplatePopulated)?.displayName
//                 }`}
//                 onYes={onDeleteSure}
//             />
//         </FieldBlockAccordion>
//     );
// };

// export default FieldBlock;
