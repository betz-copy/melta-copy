import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { IPermissionsOfUser } from '../../services/permissionsService';
import ResizablePanel from './Resizable';
import IFramePage from './IFramePage';
import { searchIFrames } from '../../services/iFramesService';
import { InfiniteScroll } from '../../common/InfiniteScroll';
import { IFrame } from '../../interfaces/iFrames';
import { toast } from 'react-toastify';

// const { infiniteScrollPageCount } = environment.iFrameSettings;

interface IFramesPageProps {
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const IFramesPage: React.FC<IFramesPageProps> = ({ setTitle }) => {
    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const [search, setSearch] = useState<string>();
    const [iFrameDialogOpen, setIFrameDialogOpen] = useState<boolean>(false);

    useEffect(() => setTitle(i18next.t('pages.iFrames')), [setTitle]);

    const queryKey = ['searchIFrames', search];

    // const [gridHeight, setGridHeight] = useState<number>(80 * 5);
    const iframeData = [
        { url: '/', name: 'Iframe 1' },
        { url: '/', name: 'Iframe 2' },
        { url: '/', name: 'Iframe 3' },
        { url: '/', name: 'Iframe 4' },
        // { url: '', name: 'Iframe 5' },
        // { src: '', name: 'Iframe 6' },
        // { src: '', name: 'Iframe 7' },
        // { src: '', name: 'Iframe 8' },
        // { src: '', name: 'Iframe 9' },
        // { src: '/', name: 'Iframe 10' },
    ];

    const iFramesRows: any = [];
    for (let i = 0; i < iframeData.length; i += 2) {
        iFramesRows.push(iframeData.slice(i, i + 2));
    }
    return (
        <InfiniteScroll<IFrame>
            queryKey={queryKey}
            queryFunction={async ({ pageParam }) => searchIFrames({ limit: 10, step: pageParam, search })}
            onQueryError={(error) => {
                // eslint-disable-next-line no-console
                console.log('failed loading iFrames: ', error);
                toast.error(i18next.t('iFrames.searchFailed'));
            }}
            emptyText={i18next.t('iFrames.noIFramesFound')}
            useContainer={false}
        >
            {(iFrame) => (
                <div dir="ltr" style={{ maxHeight: '1000px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap' }}>
                    <PanelGroup direction="vertical" style={{ height: '1000px' }}>
                        {iFramesRows.map((iFrameRow, rowIndex) => (
                            <>
                                <Panel>
                                    <PanelGroup direction="horizontal" style={{ padding: '10px' }} key={rowIndex}>
                                        {iFrameRow.map((iframe, colIndex: any) => (
                                            // eslint-disable-next-line react/no-array-index-key
                                            <ResizablePanel key={colIndex}>
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        borderRadius: 3,
                                                        overflow: 'hidden',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        '&:hover': {
                                                            border: 0,
                                                            boxShadow: '-6px 6px 7px 0px #1E277540',
                                                        },
                                                    }}
                                                >
                                                    <IFramePage iFrame={iframe} />
                                                </Box>
                                            </ResizablePanel>
                                        ))}
                                    </PanelGroup>
                                </Panel>
                                {rowIndex < iFramesRows.length - 1 && <PanelResizeHandle className="mx-1 w-2 h-2 bg-slate-300" />}
                            </>
                        ))}
                    </PanelGroup>
                </div>
            )}
        </InfiniteScroll>
    );
};

export default IFramesPage;
