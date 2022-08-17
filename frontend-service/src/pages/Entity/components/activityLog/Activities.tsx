import { Divider, Grid } from '@mui/material';
import React, { useRef, useEffect } from 'react';
import { useInfiniteQuery } from 'react-query';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import ActivityLogRow from './ActivityLogRow';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { getActivityLogRequest } from '../../../../services/activityLogService';

const Activities: React.FC<{ entityId: string; entityTemplate: IMongoEntityTemplatePopulated }> = ({ entityId, entityTemplate }) => {
    const ref = useRef(null);

    const {
        data: activityLog,
        fetchNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery(['getActivityLogRequest', entityId], ({ pageParam = 0 }) => getActivityLogRequest(entityId, 10, pageParam), {
        getNextPageParam: (lastPage, allPages) => {
            const nextPage = allPages.length * 10;
            return lastPage.length !== 0 ? nextPage : undefined;
        },
        onError: (error) => {
            console.log('failed to get activities. error:', error);
            toast.error(i18next.t('entityPage.activityLog.failedToGetActivities'));
        },
        enabled: false,
        cacheTime: 0,
    });

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            {
                rootMargin: '0px',
                threshold: 0,
            },
        );

        const el = ref.current;

        if (!el) {
            return () => {};
        }
        observer.observe(el);

        return () => {
            observer.unobserve(el);
        };
    }, [ref, isFetchingNextPage]);

    return (
        <Grid container style={{ overflowX: 'auto', maxHeight: '89.5vh' }}>
            {activityLog?.pages.map((page) =>
                page.map((log) => (
                    <Grid key={log._id} item paddingTop="15px">
                        <ActivityLogRow log={log} entityTemplate={entityTemplate} />
                        <Divider variant="middle" style={{ marginTop: '7px' }} />
                    </Grid>
                )),
            )}
            <Grid container ref={ref} className="loader" justifyContent="center">
                {isFetchingNextPage ? i18next.t('entityPage.activityLog.loading') : i18next.t('entityPage.activityLog.noSearchLeft')}
            </Grid>
        </Grid>
    );
};

export { Activities };
