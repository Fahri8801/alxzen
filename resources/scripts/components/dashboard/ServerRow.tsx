import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faNetworkWired, faSignal, faBolt, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip } from '@/lib/formatters';
import tw, { styled } from 'twin.macro';
import Spinner from '@/components/elements/Spinner';
import isEqual from 'react-fast-compare';
import { motion, AnimatePresence } from 'framer-motion';

// Purple design system tokens
// Primary: #7c3aed / #a78bfa / #c4b5fd
// Surface: rgba(124,58,237,0.06) border rgba(124,58,237,0.15)
// BG: #09090f → #0c0b14

const toPercent = (val: number, max: number) => max > 0 ? Math.min((val / max) * 100, 100) : 0;

const globalStyles = `
@keyframes srv-scan {
    0%   { transform: translateY(-100%); opacity: 0; }
    10%  { opacity: 0.4; }
    90%  { opacity: 0.4; }
    100% { transform: translateY(100%); opacity: 0; }
}
@keyframes srv-dot-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.75); }
}
@keyframes srv-bar-in {
    from { width: 0%; opacity: 0; }
}
@keyframes srv-border-breathe {
    0%,100% { border-left-color: rgba(124,58,237,0.3); }
    50%      { border-left-color: rgba(124,58,237,0.8); }
}
`;

const InjectStyles = () => <style dangerouslySetInnerHTML={{ __html: globalStyles }} />;

const CardWrapper = styled(motion(Link))<{ $status: string }>`
    ${tw`relative block w-full overflow-hidden`}
    background: linear-gradient(160deg, #0d0c14 0%, #09090f 100%);
    border: 1px solid rgba(124, 58, 237, 0.12);
    border-left: 3px solid ${({ $status }) =>
        $status === 'running'  ? '#4ade80' :
        $status === 'starting' ? '#a78bfa' :
        $status === 'offline'  ? 'rgba(124,58,237,0.3)' : '#facc15'};
    border-radius: 0;
    isolation: isolate;
    animation: srv-border-breathe 5s ease-in-out infinite;

    /* scan line */
    &::before {
        content: '';
        position: absolute;
        left: 0; right: 0;
        height: 50px;
        background: linear-gradient(180deg, rgba(124,58,237,0.04) 0%, transparent 100%);
        animation: srv-scan 7s linear infinite;
        pointer-events: none;
        z-index: 0;
    }
    /* dot grid texture */
    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background-image: radial-gradient(rgba(124,58,237,0.08) 1px, transparent 1px);
        background-size: 24px 24px;
        pointer-events: none;
        z-index: 0;
    }
    & > * { position: relative; z-index: 1; }
`;

const Header = styled.div`
    ${tw`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
    border-bottom: 1px solid rgba(124,58,237,0.08);
    background: rgba(124,58,237,0.03);
`;

const ServerIconBox = styled.div`
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(124,58,237,0.1);
    border: 1px solid rgba(124,58,237,0.2);
    color: #a78bfa;
    font-size: 13px;
    flex-shrink: 0;
`;

const ServerName = styled.h3`
    ${tw`text-base font-black text-white tracking-tight m-0 leading-none`}
`;

const ConnectionBadge = styled.div`
    ${tw`flex items-center gap-1.5 text-[11px] font-mono mt-1.5`}
    color: #4b5563;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(124,58,237,0.08);
    padding: 2px 8px;
`;

const StatusBadge = styled.div<{ $status: string }>`
    ${tw`flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest flex-shrink-0`}
    padding: 5px 12px;
    background: ${({ $status }) =>
        $status === 'running'  ? 'rgba(34,197,94,0.1)'    :
        $status === 'starting' ? 'rgba(167,139,250,0.12)' :
        $status === 'offline'  ? 'rgba(124,58,237,0.08)'  : 'rgba(234,179,8,0.1)'};
    color: ${({ $status }) =>
        $status === 'running'  ? '#4ade80' :
        $status === 'starting' ? '#c4b5fd' :
        $status === 'offline'  ? '#4b5563' : '#facc15'};
    border: 1px solid ${({ $status }) =>
        $status === 'running'  ? 'rgba(34,197,94,0.2)'    :
        $status === 'starting' ? 'rgba(167,139,250,0.3)'  :
        $status === 'offline'  ? 'rgba(124,58,237,0.15)'  : 'rgba(234,179,8,0.2)'};

    .dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: currentColor;
        box-shadow: 0 0 6px currentColor;
        animation: srv-dot-pulse 2s ease-in-out infinite;
    }
`;

const StatsGrid = styled.div`
    ${tw`grid grid-cols-3`}
    border-top: 1px solid rgba(124,58,237,0.06);
`;

const StatBox = styled.div`
    ${tw`flex flex-col px-5 py-4`}
    transition: background 0.2s;
    &:not(:last-child) { border-right: 1px solid rgba(124,58,237,0.06); }
    &:hover { background: rgba(124,58,237,0.04); }
`;

const StatLabel = styled.div`
    ${tw`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-2`}
    color: rgba(124,58,237,0.5);
    svg { color: #6d28d9; }
`;

const StatValue = styled.div`
    ${tw`text-lg font-black text-white tracking-tight mb-2`}
    font-variant-numeric: tabular-nums;
`;

const BarTrack = styled.div`
    width: 100%; height: 2px;
    background: rgba(124,58,237,0.1);
`;

const BarFill = styled(motion.div)<{ $color: string }>`
    height: 100%;
    background: ${({ $color }) => $color};
    box-shadow: 0 0 6px ${({ $color }) => $color};
`;

const OfflineState = styled(motion.div)`
    ${tw`flex flex-col items-center justify-center py-7 text-center gap-2`}
`;

const HoverGlow = styled(motion.div)`
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 110%, rgba(124,58,237,0.08) 0%, transparent 70%);
    opacity: 0; pointer-events: none; z-index: 0;
`;

export default memo(({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<any>(null);
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [hovered, setHovered] = useState(false);

    const getStats = () => getServerResourceUsage(server.uuid).then(d => setStats(d)).catch(() => {});

    useEffect(() => {
        getStats();
        interval.current = setInterval(getStats, 30000);
        return () => clearInterval(interval.current);
    }, []);

    const status = stats?.status || (server.status === 'installing' ? 'starting' : 'offline');
    const isRunning = status === 'running';

    const cpuPct  = stats ? Math.min(stats.cpuUsagePercent, 100) : 0;
    const memPct  = stats ? toPercent(stats.memoryUsageInBytes, server.limits.memory * 1024 * 1024) : 0;
    const diskPct = stats ? toPercent(stats.diskUsageInBytes, server.limits.disk * 1024 * 1024) : 0;

    // Color: low → violet, mid → amber, high → red
    const barColor = (pct: number) => pct > 80 ? '#f87171' : pct > 60 ? '#fbbf24' : '#a78bfa';

    const allocation = server.allocations.find(a => a.isDefault);
    const address = allocation?.alias || ip(allocation?.ip || '');

    return (
        <>
            <InjectStyles />
            <CardWrapper
                to={`/server/${server.id}`}
                className={className}
                $status={status}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                whileHover={{
                    y: -3,
                    boxShadow: '0 12px 40px -10px rgba(124,58,237,0.3)',
                    borderColor: 'rgba(124,58,237,0.35)',
                }}
                animate={status === 'starting' ? {
                    boxShadow: ['0 0 0 rgba(167,139,250,0)', '0 0 24px rgba(167,139,250,0.25)', '0 0 0 rgba(167,139,250,0)']
                } : {}}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            >
                <HoverGlow animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.3 }} />

                <Header>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ServerIconBox>
                            <FontAwesomeIcon icon={faServer} />
                        </ServerIconBox>
                        <div>
                            <ServerName>{server.name}</ServerName>
                            <ConnectionBadge>
                                <FontAwesomeIcon icon={faNetworkWired} style={{ fontSize: 9 }} />
                                {address}:{allocation?.port}
                            </ConnectionBadge>
                        </div>
                    </div>
                    <StatusBadge $status={status}>
                        <div className="dot" />
                        {status === 'running' ? 'Online' : status === 'starting' ? 'Starting' : status === 'offline' ? 'Offline' : 'Standby'}
                    </StatusBadge>
                </Header>

                <AnimatePresence mode="wait">
                    {!isRunning ? (
                        <OfflineState key="off"
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                        >
                            <FontAwesomeIcon
                                icon={status === 'starting' ? faBolt : faSignal}
                                style={{ fontSize: 24, color: status === 'starting' ? '#7c3aed' : '#1f1b2e', marginBottom: 4 }}
                            />
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#2d2540', textTransform: 'uppercase' }}>
                                {status === 'starting' ? 'Booting...' : 'Offline'}
                            </span>
                        </OfflineState>
                    ) : !stats ? (
                        <motion.div key="load" css={tw`p-10 flex justify-center`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Spinner size="small" />
                        </motion.div>
                    ) : (
                        <StatsGrid key="stats">
                            <StatBox>
                                <StatLabel><FontAwesomeIcon icon={faMicrochip} /> CPU</StatLabel>
                                <StatValue>{stats.cpuUsagePercent.toFixed(1)}%</StatValue>
                                <BarTrack><BarFill $color={barColor(cpuPct)}
                                    initial={{ width: '0%' }} animate={{ width: `${cpuPct}%` }}
                                    transition={{ duration: 1.1, ease: 'easeOut' }} /></BarTrack>
                            </StatBox>
                            <StatBox>
                                <StatLabel><FontAwesomeIcon icon={faMemory} /> RAM</StatLabel>
                                <StatValue>{bytesToString(stats.memoryUsageInBytes)}</StatValue>
                                <BarTrack><BarFill $color={barColor(memPct)}
                                    initial={{ width: '0%' }} animate={{ width: `${memPct}%` }}
                                    transition={{ duration: 1.1, ease: 'easeOut', delay: 0.12 }} /></BarTrack>
                            </StatBox>
                            <StatBox>
                                <StatLabel><FontAwesomeIcon icon={faHdd} /> Disk</StatLabel>
                                <StatValue>{bytesToString(stats.diskUsageInBytes)}</StatValue>
                                <BarTrack><BarFill $color={barColor(diskPct)}
                                    initial={{ width: '0%' }} animate={{ width: `${diskPct}%` }}
                                    transition={{ duration: 1.1, ease: 'easeOut', delay: 0.24 }} /></BarTrack>
                            </StatBox>
                        </StatsGrid>
                    )}
                </AnimatePresence>
            </CardWrapper>
        </>
    );
}, isEqual);