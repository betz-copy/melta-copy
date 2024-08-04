/* eslint-disable react/no-array-index-key */
import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Box, CircularProgress, Grid, Pagination } from '@mui/material';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { iFrameObjectToIFrameForm, searchIFrames } from '../../services/iFramesService';
import ResizablePanel from './Resizable';
import IFramesHeadline from './IFramesHeadline';
import { IMongoIFrame } from '../../interfaces/iFrames';
import { IFrameWizard } from '../../common/wizards/iFrame';
import IFramePage from './IFramePage';
import { InfiniteScroll } from '../../common/InfiniteScroll';
import { ViewingBox } from '../SystemManagement/components/ViewingBox';

const IFramesPage: React.FC = () => {
    const [iFrameWizardDialogState, setIFrameWizardDialogState] = useState<{
        isWizardOpen: boolean;
        iFrame: IMongoIFrame | null;
    }>({
        isWizardOpen: false,
        iFrame: null,
    });
    const [searchInput, setSearchInput] = useState<string>();
    const [page, setPage] = useState(0);
    const [iFramesRows, setIFramesRows] = useState<any>([]);
    const [iframePages, setIframePages] = useState({});

    const queryKey = ['searchIFrames', page, searchInput];

    // const { data: allIFrames } = useQuery(['searchIFrames'], () => {
    //     return searchIFrames({});
    // });
    // const { isLoading } = useQuery(
    //     queryKey,
    //     () => {
    //         // const { cacheBlockSize } = environment.agGrid;
    //         return searchIFrames({
    //             search: searchInput,
    //             skip: page * 4,
    //             limit: 4,
    //         });
    //     },
    //     {
    //         onSuccess: (data) => {
    //             setIframePages((prev) => ({ ...prev, [page]: data }));
    //         },
    //         onError: () => {
    //             toast.error(i18next.t('templateEntitiesAutocomplete.failedToSearchEntities'));
    //         },
    //         retry: false,
    //         keepPreviousData: true,
    //     },
    // );
    // const handlePageNumber = (pageIndex: number) => {
    //     setPage(pageIndex);
    // };

    // useEffect(() => {
    //     if (iframePages[page]) {
    //         const rows: any = [];
    //         for (let i = 0; i < iframePages[page].length; i += 2) {
    //             rows.push(iframePages[page].slice(i, i + 2));
    //         }
    //         setIFramesRows(rows);
    //     }
    // }, [iframePages[page]]);
    // const [count, setCount] = useState<number>(0);
    // useEffect(() => {
    //     if (searchInput) {
    //         // console.log(Object.keys(iframePages), { iframePages }, { data });

    //         setCount(Object.keys(iframePages).length);

    //         // setIFramesRows(rows);
    //     } else if (allIFrames) setCount(Math.ceil(allIFrames!.length / 4));
    //     else setCount(0);
    // }, [searchInput]);
    // console.log({ count });

    // if (isLoading)
    //     return (
    //         <Grid>
    //             <CircularProgress />
    //         </Grid>
    //     );

    return (
        <Grid dir="ltr" style={{ maxHeight: '1000px', display: 'flex', flexWrap: 'wrap' }}>
            <Grid container>
                <IFramesHeadline
                    onSearch={(searchValue) => setSearchInput(searchValue || undefined)}
                    setIFrameWizardDialogState={() => {
                        setIFrameWizardDialogState({ isWizardOpen: true, iFrame: null });
                    }}
                />
            </Grid>
            <Grid item>
                <ViewingBox minHeight="82vh">
                    <InfiniteScroll
                        queryKey={queryKey}
                        queryFunction={async ({ pageParam }) => {
                            console.log({ pageParam });

                            const data = await searchIFrames({ limit: 4, search: searchInput, skip: (pageParam ?? 0) * 4 });
                            // setIframePages((prev) => ({ ...prev, [page]: data }));
                            // console.log({ data }, iframePages[page]);
                            return data;
                        }}
                        onQueryError={(error) => {
                            // eslint-disable-next-line no-console
                            console.log('failed loading gantts: ', error);
                            toast.error(i18next.t('gantts.searchFailed'));
                        }}
                        emptyText={i18next.t('gantts.noGanttsFound')}
                        useContainer={false}
                    >
                        {(iframe) => (
                            // <PanelGroup direction="vertical" style={{ height: '1000px' }}>
                            //     <PanelGroup direction="horizontal" style={{ padding: '10px', display: 'flex', flex: 1 }} key={rowIndex}>
                            //         <ResizablePanel>
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
                                <IFramePage iFrame={iframe} isIFramePage={false} />
                            </Box>
                            //         </ResizablePanel>
                            //     </PanelGroup>
                            // </PanelGroup>
                        )}
                    </InfiniteScroll>
                </ViewingBox>
            </Grid>
            {/* <Box position="relative" display="flex" width="100%" flexDirection="column" alignItems="center">
                <Grid style={{ width: '95%' }}>
                    <PanelGroup direction="vertical" style={{ height: '1000px' }}>
                        {iFramesRows.map((iFrameRow, rowIndex: number) => (
                            <>
                                <Panel style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <PanelGroup direction="horizontal" style={{ padding: '10px', display: 'flex', flex: 1 }} key={rowIndex}>
                                        {iFrameRow.map((iframe, colIndex: number) => (
                                            // eslint-disable-next-line react/no-array-index-key
                                            <ResizablePanel key={colIndex} isFirst={colIndex === 0}>
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
                                                    <IFramePage iFrame={iframe} isIFramePage={false} />
                                                </Box>
                                            </ResizablePanel>
                                        ))}
                                    </PanelGroup>
                                </Panel>
                                <Grid>{rowIndex < iFramesRows.length - 1 && <PanelResizeHandle className="mx-1 w-2 h-2 bg-slate-300" />}</Grid>
                            </>
                        ))}
                    </PanelGroup>
                </Grid>
            </Box> */}
            {/* <Grid container justifyContent="center" alignItems="center">
                <Pagination
                    count={allIFrames ? Math.ceil(allIFrames!.length / 4) : 0}
                    variant="outlined"
                    onChange={(_event, index) => {
                        handlePageNumber(index - 1);
                    }}
                />
            </Grid> */}

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
