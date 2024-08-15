import React, { useState } from 'react';
import { Grid, IconButton } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { Menu, MenuItem, Button, List, ListItem } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { TopBarGrid } from '../../common/TopBar';
import { IPermissionsOfUser } from '../../services/permissionsService';
import { BlueTitle } from '../../common/BlueTitle';
import { environment } from '../../globals';
import { GlobalSearchBar } from '../../common/EntitiesPage/Headline';

const IFramesPageHeadline: React.FC<{
    onSearch: (value: string) => void;
    setIFrameWizardDialogState?: () => void;
    iFramesOrder: any;
    setIFramesOrder: (value) => void;
}> = ({ onSearch, setIFrameWizardDialogState, iFramesOrder, setIFramesOrder }) => {
    // const theme = useTheme();

    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const [anchorEl, setAnchorEl] = useState(null);
    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleOnDragEnd = (result) => {
        if (!result.destination) return;

        const updatedItems = Array.from(iFramesOrder);
        console.log({ updatedItems });

        const [reorderedItem] = updatedItems.splice(result.source.index, 1);
        updatedItems.splice(result.destination.index, 0, reorderedItem);

        setIFramesOrder(updatedItems);
        queryClient.setQueryData('allIFrames', updatedItems);
    };
    console.log('hh ', { iFramesOrder });

    return (
        <TopBarGrid sx={{ height: '3.6rem' }} dir="rtl" container justifyContent="space-between" alignItems="center" wrap="nowrap">
            <Grid container spacing={5} wrap="nowrap" alignItems="center">
                <Grid item>
                    <BlueTitle
                        title={i18next.t('pages.iFrames')}
                        component="h4"
                        variant="h4"
                        style={{ fontSize: environment.mainFontSizes.headlineTitleFontSize }}
                    />
                </Grid>
                <Grid item>
                    <Button onClick={handleOpen}>Open Draggable List</Button>

                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                        <DragDropContext onDragEnd={handleOnDragEnd}>
                            <Droppable droppableId="items">
                                {(provided) => (
                                    <List
                                        // key={provided.droppableProps['data-rbd-droppable-id']}
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        style={{ padding: '8px', width: '200px' }}
                                    >
                                        {iFramesOrder.map(({ _id, name }, index) => (
                                            <Draggable key={_id} draggableId={_id} index={index}>
                                                {(provided) => (
                                                    <ListItem
                                                        key={_id}
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={{
                                                            padding: '8px',
                                                            marginBottom: '4px',
                                                            backgroundColor: '#f0f0f0',
                                                            ...provided.draggableProps.style,
                                                        }}
                                                    >
                                                        {name}
                                                    </ListItem>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </List>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </Menu>
                </Grid>
                <Grid item>
                    <Grid container wrap="nowrap" gap="15px">
                        <GlobalSearchBar onSearch={onSearch} borderRadius="7px" placeholder={i18next.t('globalSearch.searchInPage')} toTopBar />
                    </Grid>
                </Grid>
            </Grid>
            {/* <Grid item>
        <IconButton
            onClick={() => {
                clearIFramesDimensions();
                // onSetStartDate(null);
                // onSetEndDate(null);
            }}
            sx={{ borderRadius: 10, height: '35px', width: '35px' }}
        >
            <FilterAltOffIcon />
        </IconButton>
    </Grid> */}
            <Grid item>
                {myPermissions.templatesManagementId && (
                    <IconButton onClick={setIFrameWizardDialogState}>
                        <AddIcon htmlColor="primary" />
                        {/* <Typography fontSize={14} style={{ fontWeight: '500' }}>
                {i18next.t('wizard.iFrame.addIFrame')}
            </Typography> */}
                    </IconButton>
                )}
            </Grid>
        </TopBarGrid>
    );
};

export default IFramesPageHeadline;
