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
    ${tw`relative block w-full rounded-3xl overflow-hidden backdrop-blur-md`}
    background: linear-gradient(180deg, rgba(30, 30, 35, 0.7), rgba(15, 15, 20, 0.95));
    
    border: 1px solid rgba(255, 255, 255, 0.05);
        
    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
    
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);

    &:hover {
        transform: translateY(-4px) scale(1.01);
        background: linear-gradient(180deg, rgba(40, 40, 45, 0.8), rgba(20, 20, 25, 0.95));
        border-color: ${({ $status }) => 
            $status === 'running' ? 'rgba(34, 197, 94, 0.4)' : 
            $status === 'starting' ? 'rgba(96, 165, 250, 0.5)' :
            $status === 'offline' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.4)'};
        
        box-shadow: ${({ $status }) => 
            $status === 'running' ? '0 20px 40px -10px rgba(34, 197, 94, 0.25)' : 
            $status === 'starting' ? '0 20px 40px -10px rgba(96, 165, 250, 0.3)' :
            $status === 'offline' ? '0 20px 40px -10px rgba(239, 68, 68, 0.2)' : '0 20px 40px -10px rgba(234, 179, 8, 0.25)'};
            
        &::before {
            opacity: 1;
            width: 100%;
        }
    }


    &::before {
        content: '';
        position: absolute;
        top: 0; left: 50%;
        transform: translateX(-50%);
        width: 40%;
        height: 2px;
        background: ${({ $status }) => 
            $status === 'running' ? 'linear-gradient(90deg, transparent, #4ade80, transparent)' : 
            $status === 'starting' ? 'linear-gradient(90deg, transparent, #60a5fa, transparent)' :
            $status === 'offline' ? 'linear-gradient(90deg, transparent, #f87171, transparent)' : 'linear-gradient(90deg, transparent, #facc15, transparent)'};
        opacity: ${({ $status }) => $status === 'running' ? '0.7' : '0.3'};
        transition: all 0.4s ease;
    }
`;

const Header = styled.div`
    ${tw`p-6 flex flex-col md:flex-row items-start justify-between border-b border-white/5 bg-white/[0.02] gap-4`}
`;

const ServerName = styled.h3`
    ${tw`text-2xl font-black text-white tracking-tight mb-2 flex items-center gap-3`}
`;

const ConnectionInfo = styled.div`
    ${tw`flex items-center gap-2 text-xs font-mono text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 w-max`}
`;

const StatusBadge = styled.div<{ $status: string }>`
    ${tw`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg`}
    
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

const StatBox = styled.div`
    ${tw`flex flex-col items-center justify-center px-4 text-center group`}
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
    ${tw`w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5`}
`;

const ProgressBarFill = styled.div<{ $percent: number; $color: string }>`
    ${tw`h-full rounded-full transition-all duration-1000 ease-out`}
    width: ${props => props.$percent}%;
    background: linear-gradient(90deg, transparent, ${props => props.$color});
    box-shadow: 0 0 15px ${props => props.$color};
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
                                $color="#60a5fa" // Blue
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
                                $color="#c084fc" // Purple
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
                                $color="#f472b6" // Pink
                            />
                        </ProgressBarContainer>
                    </StatBox>
                </StatsGrid>
            )}
        </CardWrapper>
    );
}, isEqual);