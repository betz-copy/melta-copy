/* eslint-disable array-callback-return */
import React, { useEffect, useState } from 'react';
import { Box, Tabs } from '@mui/material';
import i18next from 'i18next';
import { useQuery, useQueryClient } from 'react-query';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { toast } from 'react-toastify';
import { IPermissionsOfUser } from '../../services/permissionsService';
import ResizablePanel from './Resizable';
import IFramePage from './IFramePage';
import { searchIFrames } from '../../services/iFramesService';
import { InfiniteScroll } from '../../common/InfiniteScroll';
import { IFrame, IMongoIFrame } from '../../interfaces/iFrames';
import { ViewingBox } from '../SystemManagement/components/ViewingBox';
// import { toast } from 'react-toastify';

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
    // const y = searchIFrames({ limit: 10, step: 10 });
    // console.log({ y });
    // const allIFrames = useQuery(queryKey, async () => searchIFrames({})).data;
    // console.log({ allIFrames });

    // // const framess: IMongoIFrame[] = [];
    // const iFramesRows: any = [];
    // for (let i = 0; i < allIFrames!.length; i += 2) {
    //     iFramesRows.push(allIFrames!.slice(i, i + 2));
    // }
    // console.log({ iFramesRows });

    const allIFrames = useQuery(queryKey, async () => searchIFrames({})).data;
    console.log({ allIFrames });

    // const itemsPerPage = 6;
    // const totalPages = Math.ceil(allIFrames!.length / itemsPerPage);

    // const paginatedIFrames: any[] = [];
    // for (let page = 0; page < totalPages; page++) {
    //     const pageIFrames = allIFrames!.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
    //     console.log({ pageIFrames });

    //     const iFramesRows: any[] = [];
    //     for (let i = 0; i < pageIFrames.length; i += 2) {
    //         iFramesRows.push(pageIFrames.slice(i, i + 2));
    //     }
    //     paginatedIFrames.push(iFramesRows);
    // }

    // console.log({ paginatedIFrames });

    return (
        <div dir="ltr" style={{ maxHeight: '1000px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap' }}>
            {/* {
                // eslint-disable-next-line array-callback-return
                paginatedIFrames.map((pages: any[]) => {
                    // eslint-disable-next-line array-callback-return
                    pages.map((rows) => {
                        // eslint-disable-next-line array-callback-return
                        rows.map((iFrame: IMongoIFrame) => {
                            <div>{iFrame.name}</div>;
                        });
                    });
                })
            } */}
            {/* <Tabs
                value="{value}"
                onChange={() => {}}
                variant="scrollable"
                scrollButtons
                allowScrollButtonsMobile
                aria-label="scrollable force tabs example"
            > */}
            {allIFrames?.map((iFrame) => {
                // <Panel>
                //     <ResizablePanel>
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
                    {iFrame.name}
                    {/* <IFramePage iFrame={iFrame} /> */}
                </Box>;
                //     </ResizablePanel>
                //     ;
                // </Panel>;
            })}
            {/* </Tabs> */}
        </div>
    );
};

export default IFramesPage;
