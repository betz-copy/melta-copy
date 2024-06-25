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
import { BorderRadius } from '../../utils/icons/boxIcons';
import IFramesHeadline from './Headline';

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
        <div dir="ltr">
            <PanelGroup direction="vertical" style={{ height: '1000px' }}>
                <Panel>
                    <PanelGroup direction="horizontal" style={{ padding: '10px' }}>
                        <Panel
                            className="bg-slate-100 rounded-lg flex items-center justify-center text-center p-2"
                            style={{ padding: '10px' }}
                            defaultSize={33}
                            minSize={20}
                        >
                            <Box
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    // borderStyle: 'solid',
                                    '&:hover': {
                                        border: 0,
                                        boxShadow: '-6px 6px 7px 0px #1E277540',
                                    },
                                }}
                            >
                                <IFramesHeadline iFrame={{ name: 'shirel' }} />
                                <Iframe
                                    url="/"
                                    width="100%"
                                    height="100%"
                                    styles={{
                                        maxHeight: '100%',
                                        overflow: 'auto',
                                        //  borderRadius: 'inherit'
                                    }}
                                />
                            </Box>
                        </Panel>
                        <PanelResizeHandle className="mx-1 w-2 h-2 bg-slate-300" />
                        <Panel
                            className="bg-slate-100 rounded-lg flex items-center justify-center text-center p-2"
                            defaultSize={67}
                            minSize={20}
                            style={{ padding: '10px' }}
                        >
                            <Box
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    // borderStyle: 'solid',
                                    '&:hover': {
                                        border: 0,
                                        boxShadow: '-6px 6px 7px 0px #1E277540',
                                    },
                                }}
                            >
                                <Iframe
                                    url="http://www.youtube.com/embed/xDMP3i36naA"
                                    width="100%"
                                    id="myId"
                                    height="100%"
                                    styles={{ borderRadius: 'inherit' }}
                                />
                            </Box>
                        </Panel>
                    </PanelGroup>
                </Panel>
                <PanelResizeHandle className="mx-1 w-2 h-2 bg-slate-300" />
                <Panel>
                    <PanelGroup direction="horizontal" style={{ padding: '10px' }}>
                        <Panel
                            className="bg-slate-100 rounded-lg flex items-center justify-center text-center p-2"
                            style={{ padding: '10px' }}
                            defaultSize={33}
                            minSize={20}
                        >
                            <Box
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    // borderStyle: 'solid',
                                    '&:hover': {
                                        border: 0,
                                        boxShadow: '-6px 6px 7px 0px #1E277540',
                                    },
                                }}
                            >
                                <Iframe
                                    url="http://www.youtube.com/embed/xDMP3i36naA"
                                    width="100%"
                                    id="myId"
                                    height="100%"
                                    styles={{ borderRadius: 'inherit' }}
                                />
                            </Box>
                        </Panel>
                        <PanelResizeHandle className="mx-1 w-2 h-2 bg-slate-300" />
                        <Panel
                            className="bg-slate-100 rounded-lg flex items-center justify-center text-center p-2"
                            defaultSize={67}
                            minSize={20}
                            style={{ padding: '10px' }}
                        >
                            <Box
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    // borderStyle: 'solid',
                                    '&:hover': {
                                        border: 0,
                                        boxShadow: '-6px 6px 7px 0px #1E277540',
                                    },
                                }}
                            >
                                <Iframe
                                    url="http://www.youtube.com/embed/xDMP3i36naA"
                                    width="100%"
                                    id="myId"
                                    height="100%"
                                    styles={{ borderRadius: 'inherit' }}
                                />
                            </Box>
                        </Panel>
                    </PanelGroup>
                </Panel>
            </PanelGroup>
        </div>
    );
};

export default IFramesPage;
