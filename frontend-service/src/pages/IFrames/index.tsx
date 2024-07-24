/* eslint-disable react/jsx-key */
/* eslint-disable array-callback-return */
import React, { useEffect, useState } from 'react';
import i18next from 'i18next';
import { useQuery, useQueryClient } from 'react-query';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Iframe from 'react-iframe';
import { Box, CircularProgress, Grid, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { IPermissionsOfUser } from '../../services/permissionsService';
import { iFrameObjectToIFrameForm, searchIFrames } from '../../services/iFramesService';
import ResizablePanel from './Resizable';
import IFramesHeadline from './Headline';
import { IMongoIFrame } from '../../interfaces/iFrames';
import { IFrameWizard } from '../../common/wizards/iFrame';

interface IFramesPageProps {
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const IFramesPage: React.FC<IFramesPageProps> = ({ setTitle }) => {
    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const [search, setSearch] = useState<string>();
    const [iFrameDialogOpen, setIFrameDialogOpen] = useState<boolean>(false);

    useEffect(() => setTitle(i18next.t('pages.iFrames')), [setTitle]);

    const queryKey = ['searchIFrames'];
    // const [gridHeight, setGridHeight] = useState<number>(80 * 5);

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

    // const allIFrames = useQuery(queryKey, async () => searchIFrames({})).data;

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

    const [iFrameWizardDialogState, setIFrameWizardDialogState] = useState<{
        isWizardOpen: boolean;
        iFrame: IMongoIFrame | null;
    }>({
        isWizardOpen: false,
        iFrame: null,
    });
    // const allIFrames = queryClient.invalidateQueries(queryKey);
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

    // let flag = 0;
    // useEffect(() => {
    //     if (allIFrames && flag !== 0) {
    //         queryClient.setQueryData<IFrameMap>('searchIFrames', mapTemplates(allIFrames!));
    //         flag = 1;
    //     }
    // }, [allIFrames, flag]);
    // console.log({ iFramesRows });

    // const [currentPage, setCurrentPage] = useState(1);
    // const cardsPerPage = 4; // Number of cards per page
    // const indexOfLastCard = currentPage * cardsPerPage;
    // const indexOfFirstCard = indexOfLastCard - cardsPerPage;
    // const currentIFrames = allIFrames!.slice(indexOfFirstCard, indexOfLastCard);
    // console.log({ currentIFrames });

    if (isLoading)
        return (
            <Grid>
                <CircularProgress />
            </Grid>
        );

    return (
        <div dir="ltr" style={{ maxHeight: '1000px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap' }}>
            <div>
                <IconButton
                    style={{ borderRadius: '5px', width: 'fit-content' }}
                    onClick={() => setIFrameWizardDialogState({ isWizardOpen: true, iFrame: null })}
                >
                    <AddIcon fontSize="large" />
                </IconButton>
            </div>
            <PanelGroup direction="vertical" style={{ height: '1000px' }}>
                {iFramesRows.map((iFrameRow, rowIndex) => (
                    <>
                        <Panel>
                            <PanelGroup direction="horizontal" style={{ padding: '10px' }} key={rowIndex}>
                                {iFrameRow.map((iframe, colIndex: any) => (
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
                                            <IFramesHeadline iFrame={iframe} />
                                            <Iframe url={iframe!.url} title={iframe!.name} width="100%" height="100%" />
                                        </Box>
                                    </ResizablePanel>
                                ))}
                            </PanelGroup>
                        </Panel>
                        <Grid>{rowIndex < iFramesRows.length - 1 && <PanelResizeHandle className="mx-1 w-2 h-2 bg-slate-300" />}</Grid>
                    </>
                ))}
            </PanelGroup>
            <IFrameWizard
                open={iFrameWizardDialogState.isWizardOpen}
                handleClose={() => setIFrameWizardDialogState({ isWizardOpen: false, iFrame: null })}
                initialValues={iFrameObjectToIFrameForm(iFrameWizardDialogState.iFrame)}
                isEditMode={Boolean(iFrameWizardDialogState.iFrame)}
            />
        </div>
    );
};

export default IFramesPage;
