import React, { useEffect, useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import i18next from 'i18next';
import { useQuery, useQueryClient } from 'react-query';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
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
    const all = useQuery(queryKey, async () => searchIFrames({})).data;
    console.log({ all });

    const framess: IMongoIFrame[] = [];
    const iFramesRows: any = [];
    for (let i = 0; i < iframeData.length; i += 2) {
        iFramesRows.push(iframeData.slice(i, i + 2));
    }
    return (
        <div dir="ltr" style={{ maxHeight: '1000px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap' }}>
            {/* <Tabs
                value="{value}"
                onChange={() => {}}
                variant="scrollable"
                scrollButtons
                allowScrollButtonsMobile
                aria-label="scrollable force tabs example"
            >
                <Tab label="Item One" />
                <Tab label="Item Two" />
                <Tab label="Item Three" />
                <Tab label="Item Four" />
                <Tab label="Item Five" />
                <Tab label="Item Six" />
                <Tab label="Item Seven" />

                <Tab label="1 Seven" />
                <Tab label="2 Seven" />
                <Tab label="3 Seven" />
                <Tab label="4 Seven" />
                <Tab label="5 Seven" />
                <Tab label="6 Seven" />
                <Tab label="7 Seven" />
                <Tab label="8 Seven" />
                <Tab label="9 Seven" />
                <Tab label="00 Seven" />
                <Tab label="0000 Seven" />
                <Tab label="Ite0000m Seven" />
            </Tabs> */}
        </div>
    );
};

export default IFramesPage;
