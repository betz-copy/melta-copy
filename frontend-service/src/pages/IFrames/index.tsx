/* eslint-disable react/no-array-index-key */
import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Box, CircularProgress, Grid, Pagination } from '@mui/material';
import { toast } from 'react-toastify';
import i18next from 'i18next';
// import { DndProvider, useDrag, useDrop } from 'react-dnd';
// import { HTML5Backend } from 'react-dnd-html5-backend';
import { iFrameObjectToIFrameForm, searchIFrames } from '../../services/iFramesService';
import ResizablePanel from './Resizable';
import IFramesPageHeadline from './IFramesHeadline';
import { IFrame, IMongoIFrame } from '../../interfaces/iFrames';
import { IFrameWizard } from '../../common/wizards/iFrame';
import IFramePage from './IFramePage';
import { InfiniteScroll } from '../../common/InfiniteScroll';
import { ViewingBox } from '../SystemManagement/components/ViewingBox';
import { Resizable } from './ResizableBox';
import { ResizeBox } from '../../common/EntitiesPage/ResizeBox';
import { mapTemplates } from '../../utils/templates';

// const DraggableIFrame = ({ iFrame, index, moveIFrame }) => {
//     const [, ref] = useDrag({
//         type: 'iframe',
//         item: { index },
//     });

//     const [, drop] = useDrop({
//         accept: 'iframe',
//         hover: (draggedItem: any) => {
//             if (draggedItem.index !== index) {
//                 moveIFrame(draggedItem.index, index);
//                 // eslint-disable-next-line no-param-reassign
//                 draggedItem.index = index;
//             }
//         },
//     });

//     return (
//         <div ref={(node) => ref(drop(node))} style={{ marginBottom: 20 }}>
//             <Resizable minHeight={500} minWidth={1000} maxHeight={800} maxWidth={2000} id={iFrame._id}>
//                 <Grid padding={2} height="100%" width="100%">
//                     <IFramePage iFrame={iFrame} isIFramePage={false} />
//                 </Grid>
//             </Resizable>
//         </div>
//     );
// };

const IFramesPage: React.FC = () => {
    const [iFrameWizardDialogState, setIFrameWizardDialogState] = useState<{
        isWizardOpen: boolean;
        iFrame: IMongoIFrame | null;
    }>({
        isWizardOpen: false,
        iFrame: null,
    });
    const [searchInput, setSearchInput] = useState<string>();

    const queryKey = ['searchIFrames', searchInput];

    // const { data: allIFrames } = useQuery(['searchIFrames'], () => {
    //     return searchIFrames({});
    // });

    return (
        <Grid dir="ltr" style={{ maxHeight: '1000px', display: 'flex', flexWrap: 'wrap' }}>
            <Grid container>
                <IFramesPageHeadline
                    onSearch={(searchValue) => setSearchInput(searchValue || undefined)}
                    setIFrameWizardDialogState={() => {
                        setIFrameWizardDialogState({ isWizardOpen: true, iFrame: null });
                    }}
                />
            </Grid>
            {/* <DndProvider backend={HTML5Backend}> */}
            <Grid
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    paddingLeft: 20,
                }}
            >
                <InfiniteScroll<IMongoIFrame>
                    queryKey={queryKey}
                    queryFunction={async ({ pageParam }) => {
                        const iFrames = await searchIFrames({ limit: 4, skip: pageParam });
                        return iFrames;
                        // return mapTemplates(iFrames);
                    }}
                    onQueryError={(error) => {
                        console.log('Failed loading data:', error);
                        toast.error(i18next.t('iFrames.searchFailed'));
                    }}
                    getNextPageParam={(lastPage, allPages) => {
                        const nextPage = allPages.length * 4;
                        return lastPage.length ? nextPage : undefined;
                    }}
                    emptyText={i18next.t('iFrames.noIFramesFound')}
                    useContainer={false}
                >
                    {(iFrame) => {
                        return (
                            // <DraggableIFrame key={iFrame._id} iFrame={iFrame} index={index} moveIFrame={moveIFrame} />

                            <Resizable minHeight={500} minWidth={1000} maxHeight={800} maxWidth={2000} id={iFrame._id}>
                                <Grid padding={2} height="100%" width="100%">
                                    <IFramePage iFrame={iFrame} isIFramePage={false} />
                                </Grid>
                            </Resizable>
                        );
                    }}
                </InfiniteScroll>
            </Grid>
            {/* </DndProvider> */}
            <IFrameWizard
                open={iFrameWizardDialogState.isWizardOpen}
                handleClose={() => setIFrameWizardDialogState({ isWizardOpen: false, iFrame: null })}
                initialValues={iFrameObjectToIFrameForm(iFrameWizardDialogState.iFrame)}
                isEditMode={Boolean(iFrameWizardDialogState.iFrame)}
            />
        </Grid>
    );
};

export default IFramesPage;
