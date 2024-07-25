/* eslint-disable react/jsx-key */
/* eslint-disable array-callback-return */
import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Box, CircularProgress, Grid } from '@mui/material';
import { IPermissionsOfUser } from '../../services/permissionsService';
import { iFrameObjectToIFrameForm, searchIFrames } from '../../services/iFramesService';
import ResizablePanel from './Resizable';
import IFramesHeadline from './IFramesHeadline';
import { IMongoIFrame } from '../../interfaces/iFrames';
import { IFrameWizard } from '../../common/wizards/iFrame';
import IFramePage from './IFramePage';
// interface IFramesPageProps {
//     setTitle: React.Dispatch<React.SetStateAction<string>>;
// }

const IFramesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;
    // const [iFrameDialogOpen, setIFrameDialogOpen] = useState<boolean>(false);
    const [searchInput, setSearchInput] = useState('');
    const onSearch = (newSearchInput: string) => {
        setSearchInput(newSearchInput);
    };
    const queryKey = ['searchIFrames'];

    // const { data: allIFrames, isLoading } = useQuery(queryKey, async () => searchIFrames({}), {
    // keepPreviousData: true, // Keep previous data while loading new data
    // });
    // const [inputValue, setInputValue] = useState<string>('');
    // const [page, setPage] = useState(1);
    // const [allIFrames, setAllIFrames] = useState<IMongoIFrame[]>([]);
    // const queryKey = ['searchIFrames', inputValue, page];

    // const handleNext = () => {
    //     setPage((prev) => prev + 1);
    // };

    // const handlePrev = () => {
    //     setPage((prev) => Math.max(prev - 1, 1)); // Ensure page number does not go below 1
    // };

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

    // useEffect(() => setTitle(i18next.t('pages.iFrames')), [setTitle]);

    const [iFrameWizardDialogState, setIFrameWizardDialogState] = useState<{
        isWizardOpen: boolean;
        iFrame: IMongoIFrame | null;
    }>({
        isWizardOpen: false,
        iFrame: null,
    });

    const { data: allIFrames, isLoading } = useQuery(queryKey, async () => searchIFrames({}));

    const [iFramesRows, setIFramesRows] = useState<any>([]);

    useEffect(() => {
        if (allIFrames) {
            const rows: any = [];
            for (let i = 0; i < allIFrames.length; i += 2) {
                rows.push(allIFrames.slice(i, i + 2));
            }
            setIFramesRows(rows);
        }
    }, [allIFrames]);

    if (isLoading)
        return (
            <Grid>
                <CircularProgress />
            </Grid>
        );

    return (
        <Grid dir="ltr" style={{ maxHeight: '1000px', display: 'flex', flexWrap: 'wrap' }}>
            <Grid container>
                <IFramesHeadline
                    onSearch={onSearch}
                    setIFrameWizardDialogState={() => {
                        setIFrameWizardDialogState({ isWizardOpen: true, iFrame: null });
                    }}
                />
            </Grid>
            <PanelGroup direction="vertical" style={{ height: '1050px' }}>
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

                        {/* <ResizableBox
                        // width={boxStyle.width}
                        // height={boxStyle.height}
                        // onResize={handleResize}
                        // onResizeStop={handleResize}
                        // style={{ position: 'absolute', left: boxStyle.left, top: boxStyle.top }}
                        >
                            <div
                                style={{ width: '100%', height: '100%', backgroundColor: 'lightblue' }}
                                // onDrag={(e) => handleDrag(e, { x: e.clientX, y: e.clientY })}
                                draggable
                            >
                                Box
                            </div>
                            <PanelResizeHandle className="mx-1 w-2 h-2 bg-slate-300" />
                        </ResizableBox> */}
                    </>
                ))}
            </PanelGroup>
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
