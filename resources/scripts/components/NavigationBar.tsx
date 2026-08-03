import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useRouteMatch } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBars, faTimes, faServer, faCogs, faUserCircle, faSignOutAlt, 
    faTerminal, faFolderOpen, faDatabase, faCalendarAlt, faUsers, 
    faNetworkWired, faBoxOpen, faCloudDownloadAlt,
    faKey, faHistory, faUnlockAlt
} from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw, { styled } from 'twin.macro';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Avatar from '@/components/Avatar';

// ─── Design Tokens (all purple) ──────────────────────────────────────────────
// Primary: #7c3aed (violet-700) → #a78bfa (violet-400) → #c4b5fd (violet-300)
// BG Dark: #09090f (near black with violet tint)
// Surface: rgba(124,58,237,0.06) border rgba(124,58,237,0.18)

const NavContainer = styled.div`
    ${tw`fixed top-0 left-0 right-0 z-50 h-20`}
    background: rgba(9, 9, 15, 0.88);
    border-bottom: 1px solid rgba(124, 58, 237, 0.15);
    backdrop-filter: blur(20px);
    transition: all 0.3s ease;
`;

const NavInner = styled.div`
    ${tw`max-w-[1400px] mx-auto h-full flex items-center justify-between px-6`}
`;

const LeftSection = styled.div`
    ${tw`flex items-center gap-4 md:gap-6`}
`;

const RightSection = styled.div`
    ${tw`flex items-center gap-4`}
`;

const Logo = styled(Link)`
    ${tw`text-xl md:text-2xl font-black tracking-tighter text-white no-underline block`}
    span {
        background: linear-gradient(90deg, #a78bfa, #7c3aed);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
`;

const SidebarOverlay = styled.div<{ $open: boolean }>`
    ${tw`fixed inset-0 z-[60] transition-opacity duration-300`}
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    opacity: ${props => props.$open ? 1 : 0};
    pointer-events: ${props => props.$open ? 'auto' : 'none'};
`;

const Sidebar = styled.div<{ $open: boolean }>`
    ${tw`fixed top-0 left-0 bottom-0 w-[300px] z-[70] flex flex-col`}
    background: linear-gradient(180deg, #09090f 0%, #0c0b14 100%);
    border-right: 1px solid rgba(124, 58, 237, 0.2);
    box-shadow: ${props => props.$open ? '10px 0 40px rgba(124, 58, 237, 0.15)' : 'none'};
    transform: translateX(${props => props.$open ? '0%' : '-100%'});
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
`;

const SidebarHeader = styled.div`
    ${tw`flex items-center justify-between p-6`}
    border-bottom: 1px solid rgba(124, 58, 237, 0.12);
`;

const SidebarContent = styled.div`
    ${tw`flex-1 overflow-y-auto p-4 flex flex-col gap-0.5`}
`;

const NavItem = styled(NavLink)`
    ${tw`flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 font-medium transition-all duration-200`}
    border-left: 2px solid transparent;
    border-radius: 0;

    &:hover {
        color: #c4b5fd;
        background: rgba(124, 58, 237, 0.08);
        border-left-color: rgba(124, 58, 237, 0.4);
    }

    &.active {
        color: #a78bfa;
        background: rgba(124, 58, 237, 0.12);
        border-left-color: #7c3aed;
        box-shadow: inset 20px 0 20px -20px rgba(124, 58, 237, 0.3);
    }
`;

const SectionTitle = styled.div`
    ${tw`text-[10px] font-black uppercase tracking-widest mt-5 mb-2 px-4`}
    color: rgba(124, 58, 237, 0.5);
`;

const ServerSectionButton = styled.button<{ $open: boolean }>`
    ${tw`flex items-center justify-between w-full mt-4 mb-1 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 outline-none`}
    color: ${props => props.$open ? '#a78bfa' : '#6b7280'};
    background: ${props => props.$open ? 'rgba(124,58,237,0.08)' : 'transparent'};
    border: none;
    border-left: 2px solid ${props => props.$open ? '#7c3aed' : 'transparent'};
    border-radius: 0;

    &:hover {
        color: #a78bfa;
        background: rgba(124, 58, 237, 0.06);
    }

    .chevron {
        transition: transform 0.3s ease;
        transform: ${props => props.$open ? 'rotate(180deg)' : 'rotate(0deg)'};
    }
`;

const SubMenu = styled.div<{ $open: boolean }>`
    display: grid;
    grid-template-rows: ${props => props.$open ? '1fr' : '0fr'};
    transition: grid-template-rows 0.35s ease, opacity 0.35s ease;
    opacity: ${props => props.$open ? 1 : 0};

    > div {
        overflow: hidden;
        padding-left: 0.75rem;
        border-left: 1px solid rgba(124, 58, 237, 0.12);
        margin-left: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1px;
    }
`;

const UserFooter = styled.div`
    ${tw`p-5`}
    border-top: 1px solid rgba(124, 58, 237, 0.1);
    background: rgba(124, 58, 237, 0.03);
`;

const MenuButton = styled.button`
    ${tw`w-10 h-10 flex items-center justify-center text-gray-400 transition-all duration-200`}
    background: rgba(124, 58, 237, 0.06);
    border: 1px solid rgba(124, 58, 237, 0.12);
    border-radius: 0;

    &:hover {
        color: #a78bfa;
        background: rgba(124, 58, 237, 0.15);
        border-color: rgba(124, 58, 237, 0.4);
        box-shadow: 0 0 16px rgba(124, 58, 237, 0.25);
    }
`;

export default () => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const user = useStoreState((state: ApplicationStore) => state.user.data!);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isServerMenuOpen, setIsServerMenuOpen] = useState(true);

    const match = useRouteMatch<{ id: string }>('/server/:id');
    const serverId = match?.params.id;
    const location = useLocation();

    useEffect(() => { setIsOpen(false); }, [location.pathname]);

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => { window.location.href = '/'; });
    };

    return (
        <>
            <SpinnerOverlay visible={isLoggingOut} />

            <NavContainer>
                <NavInner>
                    <LeftSection>
                        <MenuButton onClick={() => setIsOpen(true)}>
                            <FontAwesomeIcon icon={faBars} />
                        </MenuButton>
                        <Logo to={'/'}>
                            {name.substring(0, 3)}<span>{name.substring(3)}</span>
                        </Logo>
                    </LeftSection>

                    <RightSection>
                        <SearchContainer />
                        <div style={{ width: 40, height: 40, overflow: 'hidden', border: '1px solid rgba(124,58,237,0.25)', boxShadow: '0 0 12px rgba(124,58,237,0.15)' }}>
                            <Avatar.User />
                        </div>
                    </RightSection>
                </NavInner>
            </NavContainer>

            <div css={tw`h-24 w-full`} />

            <SidebarOverlay $open={isOpen} onClick={() => setIsOpen(false)} />
            <Sidebar $open={isOpen}>
                <SidebarHeader>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                        Main<span style={{ background: 'linear-gradient(90deg,#a78bfa,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Menu</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} style={{ color: '#4b5563', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </SidebarHeader>

                <SidebarContent>
                    <NavItem to={'/'} exact>
                        <FontAwesomeIcon icon={faServer} style={{ width: 16 }} /> Dashboard
                    </NavItem>

                    <SectionTitle>Account</SectionTitle>
                    <NavItem to={'/account'} exact>
                        <FontAwesomeIcon icon={faUserCircle} style={{ width: 16 }} /> My Account
                    </NavItem>
                    <NavItem to={'/account/api'}>
                        <FontAwesomeIcon icon={faKey} style={{ width: 16 }} /> API Keys
                    </NavItem>
                    <NavItem to={'/account/ssh'}>
                        <FontAwesomeIcon icon={faUnlockAlt} style={{ width: 16 }} /> SSH Keys
                    </NavItem>
                    <NavItem to={'/account/activity'}>
                        <FontAwesomeIcon icon={faHistory} style={{ width: 16 }} /> Activity Log
                    </NavItem>

                    {serverId && (
                        <>
                            <ServerSectionButton $open={isServerMenuOpen} onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}>
                                <span>Server Console</span>
                                <FontAwesomeIcon icon={faChevronDown} className="chevron" style={{ fontSize: 10 }} />
                            </ServerSectionButton>

                            <SubMenu $open={isServerMenuOpen}>
                                <div>
                                    <NavItem to={`/server/${serverId}`} exact><FontAwesomeIcon icon={faTerminal} style={{ width: 15 }} /> Terminal</NavItem>
                                    <NavItem to={`/server/${serverId}/files`}><FontAwesomeIcon icon={faFolderOpen} style={{ width: 15 }} /> Files</NavItem>
                                    <NavItem to={`/server/${serverId}/databases`}><FontAwesomeIcon icon={faDatabase} style={{ width: 15 }} /> Databases</NavItem>
                                    <NavItem to={`/server/${serverId}/schedules`}><FontAwesomeIcon icon={faCalendarAlt} style={{ width: 15 }} /> Schedules</NavItem>
                                    <NavItem to={`/server/${serverId}/users`}><FontAwesomeIcon icon={faUsers} style={{ width: 15 }} /> Users</NavItem>
                                    <NavItem to={`/server/${serverId}/backups`}><FontAwesomeIcon icon={faCloudDownloadAlt} style={{ width: 15 }} /> Backups</NavItem>
                                    <NavItem to={`/server/${serverId}/network`}><FontAwesomeIcon icon={faNetworkWired} style={{ width: 15 }} /> Network</NavItem>
                                    <NavItem to={`/server/${serverId}/startup`}><FontAwesomeIcon icon={faBoxOpen} style={{ width: 15 }} /> Startup</NavItem>
                                    <NavItem to={`/server/${serverId}/activity`}><FontAwesomeIcon icon={faHistory} style={{ width: 15 }} /> Activity</NavItem>
                                    <NavItem to={`/server/${serverId}/settings`}><FontAwesomeIcon icon={faCogs} style={{ width: 15 }} /> Settings</NavItem>
                                </div>
                            </SubMenu>
                        </>
                    )}

                    {rootAdmin && (
                        <>
                            <div style={{ margin: '8px 0', borderTop: '1px solid rgba(124,58,237,0.1)' }} />
                            <a href={'/admin'} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                                color: '#a78bfa', fontWeight: 700, fontSize: 13, textDecoration: 'none',
                                borderLeft: '2px solid rgba(124,58,237,0.4)',
                                background: 'rgba(124,58,237,0.06)',
                                transition: 'all 0.2s'
                            }}>
                                <FontAwesomeIcon icon={faCogs} style={{ width: 15 }} /> Admin Panel
                            </a>
                        </>
                    )}
                </SidebarContent>

                <UserFooter>
                    <div css={tw`flex items-center gap-3`}>
                        <div style={{ width: 36, height: 36, overflow: 'hidden', border: '1px solid rgba(124,58,237,0.3)', flexShrink: 0 }}>
                            <Avatar.User />
                        </div>
                        <div css={tw`flex-1 min-w-0`}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{user.username}</div>
                            <div style={{ fontSize: 10, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {user.rootAdmin ? 'Administrator' : 'User'}
                            </div>
                        </div>
                        <button onClick={onTriggerLogout} style={{ color: '#374151', transition: 'color 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#374151')}
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    </div>
                </UserFooter>
            </Sidebar>
        </>
    );
};
