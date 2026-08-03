import React, { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow from '@/components/dashboard/ServerRow';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/components/elements/Switch';
import tw, { styled } from 'twin.macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import AnnounceBar from '@/components/elements/AnnounceBar';
import { motion, AnimatePresence } from 'framer-motion';

const dashboardStyles = `
@keyframes dash-title-in {
    from { opacity: 0; transform: translateX(-16px); }
    to   { opacity: 1; transform: translateX(0); }
}
@keyframes dash-line-expand {
    from { width: 0; }
    to   { width: 60px; }
}
@keyframes dash-skeleton {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
}
`;

const RootContainer = styled.div`
    ${tw`w-full max-w-[1400px] mx-auto p-4 md:p-8`}
`;

const HeaderSection = styled.div`
    ${tw`flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6`}
`;

const TitleBox = styled.div`
    ${tw`text-left`}
    animation: dash-title-in 0.5s ease both;
`;

const AccentLine = styled.div`
    height: 2px;
    width: 60px;
    background: linear-gradient(90deg, #7c3aed, transparent);
    margin-bottom: 14px;
    animation: dash-line-expand 0.5s ease both 0.1s;
`;

const Title = styled.h1`
    ${tw`text-5xl md:text-6xl font-black tracking-tighter text-white mb-1`}
    letter-spacing: -2px;
    span {
        background: linear-gradient(90deg, #a78bfa, #7c3aed);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
`;

const SubTitle = styled.p`
    ${tw`text-base font-medium m-0`}
    color: rgba(148,163,184,0.6);
    letter-spacing: 0.3px;
`;

const FilterBar = styled(motion.div)`
    ${tw`flex items-center gap-4 px-5 py-3`}
    background: rgba(124,58,237,0.06);
    border: 1px solid rgba(124,58,237,0.18);
    backdrop-filter: blur(8px);
`;

const FilterLabel = styled.span`
    ${tw`text-[11px] font-bold uppercase tracking-widest`}
    color: #7c3aed;
`;

const Grid = styled.div`
    ${tw`grid grid-cols-1 lg:grid-cols-2 gap-4 pb-20`}
`;

const SkeletonCard = styled.div`
    height: 170px;
    background: linear-gradient(90deg, #0d0c14 25%, #13111f 50%, #0d0c14 75%);
    background-size: 400px 100%;
    animation: dash-skeleton 1.4s infinite linear;
    border: 1px solid rgba(124,58,237,0.08);
    border-left: 2px solid rgba(124,58,237,0.15);
`;

const EmptyState = styled(motion.div)`
    ${tw`col-span-2 flex flex-col items-center justify-center py-24 text-center gap-3`}
    border: 1px dashed rgba(124,58,237,0.15);
    background: rgba(124,58,237,0.02);
`;

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');
    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const username = useStoreState((state) => state.user.data!.username);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    useEffect(() => { setPage(1); }, [showOnlyAdmin]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            <style dangerouslySetInnerHTML={{ __html: dashboardStyles }} />
            <NavigationBar />
            <RootContainer>
                <HeaderSection>
                    <TitleBox>
                        <AccentLine />
                        <Title>Hello, <span>{username}</span></Title>
                        <SubTitle>System online — awaiting your command.</SubTitle>
                    </TitleBox>

                    {rootAdmin && (
                        <FilterBar
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                        >
                            <FilterLabel>Admin View</FilterLabel>
                            <Switch
                                name={'show_all_servers'}
                                defaultChecked={showOnlyAdmin}
                                onChange={() => setShowOnlyAdmin((s) => !s)}
                            />
                        </FilterBar>
                    )}
                </HeaderSection>

                <AnnounceBar displayLocation="dashboard" />

                <AnimatePresence mode="wait">
                    {!servers ? (
                        <Grid key="skeleton">
                            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                        </Grid>
                    ) : (
                        <Pagination data={servers} onPageSelect={setPage}>
                            {({ items }) =>
                                items.length > 0 ? (
                                    <Grid>
                                        {items.map((server, index) => (
                                            <motion.div
                                                key={server.uuid}
                                                initial={{ opacity: 0, y: 24 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.4,
                                                    delay: index * 0.07,
                                                    ease: [0.2, 0.8, 0.2, 1]
                                                }}
                                            >
                                                <ServerRow server={server} />
                                            </motion.div>
                                        ))}
                                    </Grid>
                                ) : (
                                    <EmptyState
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <span style={{ fontSize: 36, opacity: 0.15 }}>◻</span>
                                        <p style={{ color: '#2d2540', fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>
                                            No Servers
                                        </p>
                                        <p style={{ color: '#1e1b2e', fontSize: 12, margin: 0 }}>
                                            Create or assign a server to get started.
                                        </p>
                                    </EmptyState>
                                )
                            }
                        </Pagination>
                    )}
                </AnimatePresence>
            </RootContainer>
        </PageContentBlock>
    );
};