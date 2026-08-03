import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faNetworkWired, faTerminal, faSignal } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip } from '@/lib/formatters';
import tw, { styled } from 'twin.macro';
import Spinner from '@/components/elements/Spinner';
import isEqual from 'react-fast-compare';
import { motion } from 'framer-motion';

const CardWrapper = styled(motion(Link))<{ $status: string }>`
    ${tw`relative block w-full rounded-none overflow-hidden`}
    background: linear-gradient(145deg, #121212 0%, #0a0a0a 100%);
    
    border: 1px solid rgba(229, 9, 20, 0.1);
    border-left: 4px solid ${({ $status }) => 
        $status === 'running' ? '#4ade80' : 
        $status === 'starting' ? '#60a5fa' :
        $status === 'offline' ? '#e50914' : '#facc15'};
        
    box-shadow: 0 8px 30px -10px rgba(0,0,0,0.8);
    
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

    &:hover {
        transform: translateY(-2px);
        background: linear-gradient(145deg, #181818 0%, #0f0f0f 100%);
        border-color: rgba(229, 9, 20, 0.4);
        border-left-color: ${({ $status }) => 
            $status === 'running' ? '#4ade80' : 
            $status === 'starting' ? '#60a5fa' :
            $status === 'offline' ? '#ff0033' : '#facc15'};
        
        box-shadow: 0 12px 35px -10px rgba(229, 9, 20, 0.3);
    }
`;

const Header = styled.div`
    ${tw`p-6 flex flex-col md:flex-row items-start justify-between border-b border-white/5 bg-white/[0.02] gap-4`}
`;

const ServerName = styled.h3`
    ${tw`text-2xl font-black text-white tracking-tight mb-2 flex items-center gap-3`}
`;

const ConnectionInfo = styled.div`
    ${tw`flex items-center gap-2 text-xs font-mono text-gray-400 bg-black/40 px-4 py-2 rounded-none border border-red-500/20 w-max`}
`;

const StatusBadge = styled.div<{ $status: string }>`
    ${tw`flex items-center gap-2 px-4 py-2 rounded-none font-black text-[11px] uppercase tracking-widest shadow-lg`}
    
    background-color: ${({ $status }) => 
        $status === 'running' ? 'rgba(34, 197, 94, 0.15)' : 
        $status === 'starting' ? 'rgba(96, 165, 250, 0.15)' :
        $status === 'offline' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)'};
    
    color: ${({ $status }) => 
        $status === 'running' ? '#4ade80' : 
        $status === 'starting' ? '#60a5fa' :
        $status === 'offline' ? '#f87171' : '#facc15'};
    
    border: 1px solid ${({ $status }) => 
        $status === 'running' ? 'rgba(34, 197, 94, 0.3)' : 
        $status === 'starting' ? 'rgba(96, 165, 250, 0.3)' :
        $status === 'offline' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.3)'};

    .dot {
        ${tw`w-2 h-2 rounded-full`}
        background-color: currentColor;
        box-shadow: 0 0 10px currentColor;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
    }
`;

const StatsGrid = styled.div`
    ${tw`grid grid-cols-3 divide-x divide-white/5 p-6 bg-black/10`}
`;

const StatBox = styled.div.attrs({ className: 'group' })`
    ${tw`flex flex-col items-center justify-center px-4 text-center`}
`;

const StatValue = styled.div`
    ${tw`text-xl font-bold text-white mb-2 tracking-tight group-hover:scale-110 transition-transform duration-300`}
`;

const StatLabel = styled.div`
    ${tw`text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3`}
    svg {
        ${tw`text-gray-400 group-hover:text-white transition-colors duration-300`}
    }
`;

const ProgressBarContainer = styled.div`
    ${tw`w-full h-1.5 bg-[#1a1a1a] rounded-none overflow-hidden border-b border-white/5`}
`;

const ProgressBarFill = styled.div<{ $percent: number; $color: string }>`
    ${tw`h-full rounded-none transition-all duration-1000 ease-out`}
    width: ${props => props.$percent}%;
    background: linear-gradient(90deg, transparent, ${props => props.$color});
    box-shadow: 0 0 10px ${props => props.$color};
`;

export default memo(({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<any>(null);
    const [stats, setStats] = useState<ServerStats | null>(null);

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

    // Limits
    const cpuLimit = server.limits.cpu;
    const memoryLimit = server.limits.memory;
    const diskLimit = server.limits.disk;

    return (
        <CardWrapper 
            to={`/server/${server.id}`} 
            className={className} 
            $status={status}
            animate={{
                boxShadow: status === 'starting' 
                    ? ['0 0 15px -2px rgba(96, 165, 250, 0.25)', '0 0 30px 2px rgba(96, 165, 250, 0.5)', '0 0 15px -2px rgba(96, 165, 250, 0.25)']
                    : undefined
            }}
            transition={{
                boxShadow: status === 'starting' ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : undefined
            }}
        >
            <Header>
                <div>
                    <ServerName>{server.name}</ServerName>
                    <ConnectionInfo>
                        <FontAwesomeIcon icon={faNetworkWired} />
                        {server.allocations.find(a => a.isDefault)?.alias || ip(server.allocations.find(a => a.isDefault)?.ip || '')}
                    </ConnectionInfo>
                </div>
                <StatusBadge $status={status}>
                    <div className="dot" />
                    {status}
                </StatusBadge>
            </Header>

            {!stats && isRunning ? (
                <div css={tw`p-10 flex justify-center`}>
                    <Spinner size={'small'} />
                </div>
            ) : !isRunning ? (
                <div css={tw`p-10 text-center`}>
                    <FontAwesomeIcon icon={faSignal} css={tw`text-gray-700 text-3xl mb-3`} />
                    <div css={tw`text-xs font-mono text-gray-600`}>SERVER IS OFFLINE</div>
                </div>
            ) : (
                <StatsGrid>
                    {/* CPU */}
                    <StatBox>
                        <StatLabel><FontAwesomeIcon icon={faMicrochip} /> CPU</StatLabel>
                        <StatValue>{stats!.cpuUsagePercent.toFixed(1)}%</StatValue>
                        <ProgressBarContainer>
                            <ProgressBarFill 
                                $percent={Math.min(stats!.cpuUsagePercent, 100)} 
                                $color="#e50914" // ROG Red
                            />
                        </ProgressBarContainer>
                    </StatBox>

                    {/* RAM */}
                    <StatBox>
                        <StatLabel><FontAwesomeIcon icon={faMemory} /> MEM</StatLabel>
                        <StatValue>{bytesToString(stats!.memoryUsageInBytes)}</StatValue>
                        <ProgressBarContainer>
                            <ProgressBarFill 
                                $percent={(stats!.memoryUsageInBytes / (memoryLimit * 1024 * 1024)) * 100} 
                                $color="#ff3333" // Bright Red
                            />
                        </ProgressBarContainer>
                    </StatBox>

                    {/* DISK */}
                    <StatBox>
                        <StatLabel><FontAwesomeIcon icon={faHdd} /> DISK</StatLabel>
                        <StatValue>{bytesToString(stats!.diskUsageInBytes)}</StatValue>
                        <ProgressBarContainer>
                            <ProgressBarFill 
                                $percent={(stats!.diskUsageInBytes / (diskLimit * 1024 * 1024)) * 100} 
                                $color="#ff0000" // Pure Red
                            />
                        </ProgressBarContainer>
                    </StatBox>
                </StatsGrid>
            )}
        </CardWrapper>
    );
}, isEqual);