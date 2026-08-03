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

// Helper: get % for progress bar
const toPercent = (val: number, max: number) => max > 0 ? Math.min((val / max) * 100, 100) : 0;

// Skeleton shimmer animation
const shimmerKeyframes = `
@keyframes alx-shimmer-anim {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}
@keyframes alx-pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 currentColor; }
    50%       { opacity: 0.6; transform: scale(0.85); box-shadow: 0 0 0 4px transparent; }
}
@keyframes alx-border-march {
    0%   { border-color: rgba(229,9,20,0.12); }
    50%  { border-color: rgba(229,9,20,0.45); }
    100% { border-color: rgba(229,9,20,0.12); }
}
@keyframes alx-bar-fill {
    from { width: 0%; opacity: 0; }
    to   { opacity: 1; }
}
@keyframes alx-scan-line {
    0%   { transform: translateY(-100%); opacity: 0; }
    10%  { opacity: 0.5; }
    90%  { opacity: 0.5; }
    100% { transform: translateY(100%); opacity: 0; }
}
@keyframes alx-card-in {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes alx-glow-in {
    from { box-shadow: none; }
    to   { box-shadow: 0 8px 40px -10px rgba(229,9,20,0.25); }
}
@keyframes alx-status-glow {
    0%, 100% { filter: brightness(1); }
    50%       { filter: brightness(1.6); }
}
`;

const InjectStyles = () => (
    <style dangerouslySetInnerHTML={{ __html: shimmerKeyframes }} />
);

// === Styled Components ===

const CardWrapper = styled(motion(Link))<{ $status: string }>`
    ${tw`relative block w-full overflow-hidden`}
    background: linear-gradient(160deg, #131313 0%, #0b0b0b 60%, #0f0a0a 100%);
    border: 1px solid rgba(229, 9, 20, 0.12);
    border-left: 3px solid ${({ $status }) =>
        $status === 'running'  ? '#4ade80' :
        $status === 'starting' ? '#60a5fa' :
        $status === 'offline'  ? '#e50914' : '#facc15'};
    border-radius: 0;
    position: relative;
    isolation: isolate;
    animation: alx-card-in 0.4s ease both, alx-border-march 5s ease-in-out infinite;

    /* Scan-line overlay */
    &::before {
        content: '';
        position: absolute;
        left: 0; right: 0;
        height: 60px;
        background: linear-gradient(180deg, rgba(229,9,20,0.03) 0%, transparent 100%);
        animation: alx-scan-line 6s linear infinite;
        pointer-events: none;
        z-index: 0;
    }
    /* Grid texture */
    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background-image: repeating-linear-gradient(
            0deg, transparent, transparent 23px,
            rgba(255,255,255,0.015) 23px, rgba(255,255,255,0.015) 24px
        ),
        repeating-linear-gradient(
            90deg, transparent, transparent 23px,
            rgba(255,255,255,0.015) 23px, rgba(255,255,255,0.015) 24px
        );
        pointer-events: none;
        z-index: 0;
    }
    & > * { position: relative; z-index: 1; }
`;

const Header = styled.div`
    ${tw`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
    border-bottom: 1px solid rgba(255,255,255,0.05);
    background: rgba(0,0,0,0.2);
`;

const ServerNameRow = styled.div`
    ${tw`flex items-center gap-3`}
`;

const ServerIcon = styled.div`
    ${tw`flex items-center justify-center`}
    width: 36px; height: 36px;
    background: rgba(229,9,20,0.1);
    border: 1px solid rgba(229,9,20,0.25);
    color: #f87171;
    font-size: 14px;
    flex-shrink: 0;
`;

const ServerName = styled.h3`
    ${tw`text-lg font-black text-white tracking-tight m-0 leading-none`}
    letter-spacing: -0.3px;
`;

const ServerMeta = styled.div`
    ${tw`flex items-center gap-2 mt-1.5`}
`;

const ConnectionBadge = styled.div`
    ${tw`flex items-center gap-1.5 text-[11px] font-mono text-gray-500`}
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    padding: 2px 8px;
    letter-spacing: 0.3px;
`;

const StatusBadge = styled.div<{ $status: string }>`
    ${tw`flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest`}
    padding: 5px 12px;
    border-radius: 0;
    background: ${({ $status }) =>
        $status === 'running'  ? 'rgba(34,197,94,0.12)'  :
        $status === 'starting' ? 'rgba(96,165,250,0.12)' :
        $status === 'offline'  ? 'rgba(229,9,20,0.12)'   : 'rgba(234,179,8,0.12)'};
    color: ${({ $status }) =>
        $status === 'running'  ? '#4ade80' :
        $status === 'starting' ? '#60a5fa' :
        $status === 'offline'  ? '#f87171' : '#facc15'};
    border: 1px solid ${({ $status }) =>
        $status === 'running'  ? 'rgba(34,197,94,0.25)'  :
        $status === 'starting' ? 'rgba(96,165,250,0.25)' :
        $status === 'offline'  ? 'rgba(229,9,20,0.3)'    : 'rgba(234,179,8,0.25)'};
    animation: alx-status-glow 2.5s ease-in-out infinite;
    flex-shrink: 0;

    .dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: currentColor;
        box-shadow: 0 0 8px currentColor;
        animation: alx-pulse-dot 1.8s ease-in-out infinite;
    }
`;

const StatsGrid = styled.div`
    ${tw`grid grid-cols-3`}
    border-top: 1px solid rgba(255,255,255,0.04);
`;

const StatBox = styled.div`
    ${tw`flex flex-col px-5 py-4 relative`}
    &:not(:last-child) { border-right: 1px solid rgba(255,255,255,0.04); }
    transition: background 0.2s;
    &:hover { background: rgba(229,9,20,0.04); }
`;

const StatLabel = styled.div`
    ${tw`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2`}
    svg { color: #e50914; opacity: 0.6; }
`;

const StatValue = styled.div`
    ${tw`text-xl font-black text-white tracking-tight mb-2`}
    letter-spacing: -0.5px;
    font-variant-numeric: tabular-nums;
`;

const BarTrack = styled.div`
    ${tw`relative w-full overflow-hidden`}
    height: 3px;
    background: rgba(255,255,255,0.06);
`;

const BarFill = styled(motion.div)<{ $color: string }>`
    height: 100%;
    background: ${({ $color }) => $color};
    box-shadow: 0 0 8px ${({ $color }) => $color};
    border-radius: 0;
`;

const OfflineState = styled(motion.div)`
    ${tw`flex flex-col items-center justify-center py-8 text-center gap-2`}
`;

const HoverGlow = styled(motion.div)`
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 120%, rgba(229,9,20,0.08) 0%, transparent 70%);
    opacity: 0;
    pointer-events: none;
    z-index: 0;
`;

export default memo(({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<any>(null);
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [hovered, setHovered] = useState(false);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch(() => {});

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

    const cpuColor  = cpuPct  > 80 ? '#f87171' : cpuPct  > 50 ? '#fb923c' : '#4ade80';
    const memColor  = memPct  > 80 ? '#f87171' : memPct  > 50 ? '#fb923c' : '#60a5fa';
    const diskColor = diskPct > 80 ? '#f87171' : diskPct > 50 ? '#fb923c' : '#a78bfa';

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
                    boxShadow: '0 16px 48px -12px rgba(229,9,20,0.35)',
                    borderColor: `rgba(229,9,20,0.4)`,
                }}
                animate={status === 'starting' ? {
                    boxShadow: [
                        '0 4px 20px rgba(96,165,250,0.1)',
                        '0 8px 30px rgba(96,165,250,0.35)',
                        '0 4px 20px rgba(96,165,250,0.1)'
                    ]
                } : {}}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            >
                <HoverGlow animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.3 }} />

                <Header>
                    <div>
                        <ServerNameRow>
                            <ServerIcon>
                                <FontAwesomeIcon icon={faServer} />
                            </ServerIcon>
                            <div>
                                <ServerName>{server.name}</ServerName>
                                <ServerMeta>
                                    <ConnectionBadge>
                                        <FontAwesomeIcon icon={faNetworkWired} style={{ fontSize: 9 }} />
                                        {address}:{allocation?.port}
                                    </ConnectionBadge>
                                </ServerMeta>
                            </div>
                        </ServerNameRow>
                    </div>
                    <StatusBadge $status={status}>
                        <div className="dot" />
                        {status === 'running' ? 'Online' : status === 'starting' ? 'Starting' : status === 'offline' ? 'Offline' : 'Standby'}
                    </StatusBadge>
                </Header>

                <AnimatePresence mode="wait">
                    {!isRunning ? (
                        <OfflineState
                            key="offline"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                        >
                            <FontAwesomeIcon
                                icon={status === 'starting' ? faBolt : faSignal}
                                style={{ fontSize: 28, color: status === 'starting' ? '#60a5fa' : '#2d2d2d', marginBottom: 6 }}
                            />
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#374151', textTransform: 'uppercase' }}>
                                {status === 'starting' ? 'Booting up...' : 'Server Offline'}
                            </span>
                        </OfflineState>
                    ) : !stats ? (
                        <motion.div
                            key="loading"
                            css={tw`p-10 flex justify-center`}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        >
                            <Spinner size={'small'} />
                        </motion.div>
                    ) : (
                        <StatsGrid key="stats">
                            {/* CPU */}
                            <StatBox>
                                <StatLabel><FontAwesomeIcon icon={faMicrochip} /> CPU</StatLabel>
                                <StatValue>{stats.cpuUsagePercent.toFixed(1)}%</StatValue>
                                <BarTrack>
                                    <BarFill
                                        $color={cpuColor}
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${cpuPct}%` }}
                                        transition={{ duration: 1.2, ease: 'easeOut' }}
                                    />
                                </BarTrack>
                            </StatBox>

                            {/* MEM */}
                            <StatBox>
                                <StatLabel><FontAwesomeIcon icon={faMemory} /> RAM</StatLabel>
                                <StatValue>{bytesToString(stats.memoryUsageInBytes)}</StatValue>
                                <BarTrack>
                                    <BarFill
                                        $color={memColor}
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${memPct}%` }}
                                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.15 }}
                                    />
                                </BarTrack>
                            </StatBox>

                            {/* DISK */}
                            <StatBox>
                                <StatLabel><FontAwesomeIcon icon={faHdd} /> Disk</StatLabel>
                                <StatValue>{bytesToString(stats.diskUsageInBytes)}</StatValue>
                                <BarTrack>
                                    <BarFill
                                        $color={diskColor}
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${diskPct}%` }}
                                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                                    />
                                </BarTrack>
                            </StatBox>
                        </StatsGrid>
                    )}
                </AnimatePresence>
            </CardWrapper>
        </>
    );
}, isEqual);