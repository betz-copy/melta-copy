import React, { useEffect, useState } from 'react';
import { Box, Grid, IconButton, Typography } from '@mui/material';
import i18next from 'i18next';
import { ResizableBox } from 'react-resizable';
import Iframe from 'react-iframe';
import { toast } from 'react-toastify';
import { AddCircle as AddCircleIcon } from '@mui/icons-material';
import { useQueryClient } from 'react-query';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ViewingBox } from '../SystemManagement/components/ViewingBox';
import { InfiniteScroll } from '../../common/InfiniteScroll';
// import { IFramesCard } from './Card';
// import { searchIFrames } from '../../services/iFramesService';
import { IFrame } from '../../interfaces/iFrames';
import { environment } from '../../globals';
import { GlobalSearchBar } from '../../common/EntitiesPage/Headline';
// import { CreateGanttDialog } from './CreateIFramesDialog';
import { IPermissionsOfUser } from '../../services/permissionsService';
import { ResizeBox } from '../../common/EntitiesPage/ResizeBox';

// const { infiniteScrollPageCount } = environment.iFrameSettings;

interface IIFramesPageProps {
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const IFramesPage: React.FC<IIFramesPageProps> = ({ setTitle }) => {
    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const [search, setSearch] = useState<string>();
    const [iFrameDialogOpen, setIFrameDialogOpen] = useState<boolean>(false);

    useEffect(() => setTitle(i18next.t('pages.iFrames')), [setTitle]);

    const queryKey = ['searchIFrames', search];

    const [gridHeight, setGridHeight] = useState<number>(80 * 5);

    return (
        // <>
        //     <Grid container direction="column" padding="0 4rem">
        //         <Grid container item justifyContent="space-between" padding="0.5rem">
        //             <Box>
        //                 <GlobalSearchBar onSearch={(searchValue) => setSearch(searchValue || undefined)} />
        //             </Box>
        //             {myPermissions.templatesManagementId && (
        //                 <IconButton onClick={() => setIFrameDialogOpen(true)}>
        //                     <AddCircleIcon color="primary" fontSize="large" />
        //                 </IconButton>
        //             )}
        //         </Grid>

        //         {/* <ViewingBox minHeight="82vh"> */}
        //         <InfiniteScroll<IFrame>
        //             queryKey={queryKey}
        //             queryFunction={async ({ pageParam }) => searchIFrames({ limit: 10, step: pageParam, search })}
        //             onQueryError={(error) => {
        //                 // eslint-disable-next-line no-console
        //                 console.log('failed loading iFrames: ', error);
        //                 toast.error(i18next.t('iFrames.searchFailed'));
        //             }}
        //             emptyText={i18next.t('iFrames.noIFramesFound')}
        //             useContainer={false}
        //         >
        //             {(iFrame) => <IFramesCard iFrame={iFrame} />}
        //         </InfiniteScroll>
        //         {/* </ViewingBox> */}
        //     </Grid>

        //     {/* <CreateIFrameDialog
        //         open={ganttDialogOpen}
        //         onClose={() => {
        //             setIFrameDialogOpen(false);
        //             queryClient.invalidateQueries(queryKey);
        //         }}
        //     /> */}
        // </>

        // <ResizeBox initialHeight={gridHeight} setHeight={setGridHeight} minHeight={100}>
        //     <Grid>
        //         <Iframe
        //             url="http://www.youtube.com/embed/xDMP3i36naA"
        //             position="absolute"
        //             width="100%"
        //             id="myId"
        //             className="myClassname"
        //             height="100%"
        //             // styles={{ height: '25px' }}
        //         />
        //     </Grid>
        // </ResizeBox>
        <div dir="ltr">
            <PanelGroup direction="vertical" style={{ height: '1000px' }}>
                <Panel>
                    <PanelGroup direction="horizontal">
                        <Panel
                            className="bg-slate-100 rounded-lg flex items-center justify-center text-center p-2"
                            style={{ backgroundColor: 'blue' }}
                            defaultSize={33}
                            minSize={20}
                        >
                            <Iframe
                                url="http://www.youtube.com/embed/xDMP3i36naA"
                                width="100%"
                                id="myId"
                                className="myClassname"
                                height="100%"
                                // styles={{ height: '25px' }}
                            />
                        </Panel>
                        <PanelResizeHandle className="mx-1 w-2 h-2 bg-slate-300" />
                        <Panel
                            className="bg-slate-100 rounded-lg flex items-center justify-center text-center p-2"
                            defaultSize={67}
                            minSize={20}
                            style={{ backgroundColor: 'red' }}
                        >
                            <Iframe
                                url="http://www.youtube.com/embed/xDMP3i36naA"
                                width="100%"
                                id="myId"
                                className="myClassname"
                                height="100%"
                                // styles={{ height: '25px' }}
                            />
                        </Panel>
                    </PanelGroup>
                </Panel>
                <PanelResizeHandle className="mx-1 w-2 h-2 bg-slate-300" />
                <Panel>
                    <PanelGroup direction="horizontal">
                        <Panel
                            className="bg-slate-100 rounded-lg flex items-center justify-center text-center p-2"
                            style={{ backgroundColor: 'green' }}
                            defaultSize={33}
                            minSize={20}
                        >
                            <Iframe
                                url="http://www.youtube.com/embed/xDMP3i36naA"
                                width="100%"
                                id="myId"
                                className="myClassname"
                                height="100%"
                                // styles={{ height: '25px' }}
                            />
                        </Panel>
                        <PanelResizeHandle className="mx-1 w-2 h-2 bg-slate-300" />
                        <Panel
                            className="bg-slate-100 rounded-lg flex items-center justify-center text-center p-2"
                            defaultSize={67}
                            minSize={20}
                            style={{ backgroundColor: 'pink' }}
                        >
                            <Iframe
                                url="http://www.youtube.com/embed/xDMP3i36naA"
                                width="100%"
                                id="myId"
                                className="myClassname"
                                height="100%"
                                // styles={{ height: '25px' }}
                            />
                        </Panel>
                    </PanelGroup>
                </Panel>
            </PanelGroup>
        </div>
    );
};

export default IFramesPage;
