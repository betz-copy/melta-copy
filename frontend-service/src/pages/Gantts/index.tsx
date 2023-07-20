import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import i18next from 'i18next';
import { ViewingBox } from '../SystemManagement/components/ViewingBox';
import { InfiniteScroll } from '../../common/InfiniteScroll';
import { GanttsCard } from './GanttCard';
import { toast } from 'react-toastify';
import { searchGantts } from '../../services/ganttsService';
import { IGantt } from '../../interfaces/gantts';
import { environment } from '../../globals';

const { infiniteScrollPageCount } = environment.gantts;

interface IGanttsPageProps {
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const GanttsPage: React.FC<IGanttsPageProps> = ({ setTitle }) => {
    useEffect(() => setTitle(i18next.t('pages.gantts')), [setTitle]);

    return (
        <Box padding="0 4rem">
            <ViewingBox minHeight="89vh">
                <InfiniteScroll<IGantt>
                    queryKey={['searchGantts']}
                    queryFunction={async ({ pageParam }) => searchGantts({ limit: infiniteScrollPageCount, step: pageParam })}
                    onQueryError={(error) => {
                        // eslint-disable-next-line no-console
                        console.log('failed loading gantts: ', error);
                        toast.error(i18next.t('gantts.searchFailed'));
                    }}
                    emptyText={i18next.t('gantts.noGanttsFound')}
                    useContainer={false}
                >
                    {(gantt) => <GanttsCard gantt={gantt} />}
                </InfiniteScroll>
            </ViewingBox>
        </Box >
    );
};

export default GanttsPage;
