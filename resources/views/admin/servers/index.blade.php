@extends('layouts.admin')

@section('title')
    Server Management
@endsection

@section('content-header')
    <h1>Servers<small>All servers managed on this panel.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Servers</li>
    </ol>
@endsection

@section('content')
<style>
/* === Alxzen Admin Server List — ROG Edition === */
@keyframes alx-admin-card-in {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes alx-admin-row-in {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
}
@keyframes alx-admin-border-pulse {
    0%,100% { border-left-color: rgba(229,9,20,0.4); }
    50%      { border-left-color: rgba(229,9,20,0.9); }
}
@keyframes alx-admin-shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
}
@keyframes alx-dot-blink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.3; }
}
@keyframes alx-search-focus-glow {
    from { box-shadow: none; }
    to   { box-shadow: 0 0 0 3px rgba(229,9,20,0.15); }
}

/* Main Card */
.alx-admin-card {
    background: linear-gradient(160deg, #111111 0%, #0b0b0b 60%, #0d0808 100%);
    border: 1px solid rgba(229,9,20,0.12);
    border-left: 3px solid #e50914;
    border-radius: 0;
    overflow: hidden;
    animation: alx-admin-card-in 0.5s ease both, alx-admin-border-pulse 4s ease-in-out infinite;
    position: relative;
}
.alx-admin-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
        repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(255,255,255,0.012) 23px, rgba(255,255,255,0.012) 24px),
        repeating-linear-gradient(90deg, transparent, transparent 23px, rgba(255,255,255,0.012) 23px, rgba(255,255,255,0.012) 24px);
    pointer-events: none;
    z-index: 0;
}
.alx-admin-card > * { position: relative; z-index: 1; }

/* Header */
.alx-admin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    padding: 18px 24px;
    border-bottom: 1px solid rgba(229,9,20,0.1);
    background: rgba(229,9,20,0.04);
}
.alx-admin-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 800;
    color: #e2e8f0;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin: 0;
}
.alx-admin-title i { color: #e50914; font-size: 15px; }
.alx-admin-count {
    background: rgba(229,9,20,0.12);
    border: 1px solid rgba(229,9,20,0.25);
    color: #fca5a5;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    letter-spacing: 0.5px;
}

/* Search controls */
.alx-admin-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.alx-admin-input {
    background: rgba(0,0,0,0.6) !important;
    border: 1px solid rgba(229,9,20,0.2) !important;
    border-radius: 0 !important;
    color: #cbd5e1 !important;
    font-size: 12px;
    height: 34px;
    padding: 0 12px;
    width: 220px;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: 'JetBrains Mono', monospace;
}
.alx-admin-input:focus {
    border-color: rgba(229,9,20,0.5) !important;
    box-shadow: 0 0 0 3px rgba(229,9,20,0.1) !important;
    outline: none;
}
.alx-admin-input::placeholder { color: #374151; }

.alx-admin-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    border: none;
    border-radius: 0;
    cursor: pointer;
    text-decoration: none !important;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
}
.alx-admin-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%);
    background-size: 200% 100%;
    animation: alx-admin-shimmer 3s infinite;
}
.alx-admin-btn-search {
    background: rgba(229,9,20,0.1);
    color: #f87171;
    border: 1px solid rgba(229,9,20,0.2);
}
.alx-admin-btn-search:hover {
    background: rgba(229,9,20,0.2);
    color: #fca5a5;
    border-color: rgba(229,9,20,0.4);
}
.alx-admin-btn-create {
    background: linear-gradient(135deg, #e50914, #b91c1c);
    color: #fff;
    box-shadow: 0 4px 14px rgba(229,9,20,0.3);
}
.alx-admin-btn-create:hover {
    box-shadow: 0 6px 20px rgba(229,9,20,0.5);
    color: #fff;
    transform: translateY(-1px);
}

/* Table */
.alx-admin-table {
    width: 100%;
    border-collapse: collapse;
}
.alx-admin-table thead tr {
    background: rgba(0,0,0,0.3);
    border-bottom: 1px solid rgba(229,9,20,0.1);
}
.alx-admin-table thead th {
    padding: 11px 20px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #4b5563;
}
.alx-admin-table tbody tr {
    border-bottom: 1px solid rgba(255,255,255,0.03);
    transition: background 0.15s, transform 0.15s;
    animation: alx-admin-row-in 0.3s ease both;
}
.alx-admin-table tbody tr:nth-child(1)  { animation-delay: 0.04s; }
.alx-admin-table tbody tr:nth-child(2)  { animation-delay: 0.08s; }
.alx-admin-table tbody tr:nth-child(3)  { animation-delay: 0.12s; }
.alx-admin-table tbody tr:nth-child(4)  { animation-delay: 0.16s; }
.alx-admin-table tbody tr:nth-child(5)  { animation-delay: 0.20s; }
.alx-admin-table tbody tr:nth-child(6)  { animation-delay: 0.24s; }
.alx-admin-table tbody tr:nth-child(7)  { animation-delay: 0.28s; }
.alx-admin-table tbody tr:nth-child(8)  { animation-delay: 0.32s; }
.alx-admin-table tbody tr:nth-child(9)  { animation-delay: 0.36s; }
.alx-admin-table tbody tr:nth-child(10) { animation-delay: 0.40s; }
.alx-admin-table tbody tr:last-child { border-bottom: none; }
.alx-admin-table tbody tr:hover {
    background: rgba(229,9,20,0.04);
}
.alx-admin-table td {
    padding: 13px 20px;
    font-size: 13px;
    color: #6b7280;
    vertical-align: middle;
}
.alx-admin-table td.alx-primary {
    color: #e2e8f0;
    font-weight: 600;
}
.alx-admin-table td a {
    color: #f87171;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.15s;
}
.alx-admin-table td a:hover { color: #fca5a5; text-decoration: underline; }
.alx-admin-table td code {
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(229,9,20,0.15);
    border-radius: 0;
    padding: 2px 7px;
    font-size: 10px;
    color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
}

/* Badges */
.alx-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
}
.alx-status .alx-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 6px currentColor;
    animation: alx-dot-blink 2s ease-in-out infinite;
}
.alx-status-active {
    background: rgba(34,197,94,0.1);
    color: #4ade80;
    border: 1px solid rgba(34,197,94,0.25);
}
.alx-status-suspended {
    background: rgba(229,9,20,0.1);
    color: #f87171;
    border: 1px solid rgba(229,9,20,0.25);
}
.alx-status-installing {
    background: rgba(234,179,8,0.1);
    color: #facc15;
    border: 1px solid rgba(234,179,8,0.25);
}

/* Action */
.alx-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px; height: 28px;
    background: rgba(229,9,20,0.08);
    border: 1px solid rgba(229,9,20,0.2);
    color: #f87171;
    text-decoration: none;
    transition: all 0.2s;
    font-size: 11px;
}
.alx-action:hover {
    background: rgba(229,9,20,0.2);
    color: #fca5a5;
    border-color: rgba(229,9,20,0.4);
    transform: scale(1.1);
}

/* Pagination */
.alx-admin-pager {
    display: flex;
    justify-content: center;
    padding: 16px 24px;
    border-top: 1px solid rgba(229,9,20,0.08);
    background: rgba(0,0,0,0.2);
}
.alx-admin-pager .pagination > li > a,
.alx-admin-pager .pagination > li > span {
    background: rgba(0,0,0,0.5) !important;
    border-color: rgba(229,9,20,0.2) !important;
    color: #f87171 !important;
    border-radius: 0 !important;
    margin: 0 2px;
}
.alx-admin-pager .pagination > .active > a,
.alx-admin-pager .pagination > .active > span {
    background: rgba(229,9,20,0.2) !important;
    border-color: rgba(229,9,20,0.5) !important;
    color: #fca5a5 !important;
}

/* Empty */
.alx-admin-empty {
    text-align: center;
    padding: 60px 20px;
    color: #1f2937;
}
.alx-admin-empty i { font-size: 36px; margin-bottom: 12px; display: block; }
.alx-admin-empty p { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
</style>

<div class="row">
    <div class="col-xs-12">
        <div class="alx-admin-card">
            <div class="alx-admin-header">
                <h3 class="alx-admin-title">
                    <i class="fa fa-server"></i>
                    Server Management
                    <span class="alx-admin-count">{{ $servers->total() }} TOTAL</span>
                </h3>
                <form action="{{ route('admin.servers') }}" method="GET">
                    <div class="alx-admin-controls">
                        <input
                            type="text"
                            name="filter[*]"
                            class="form-control alx-admin-input"
                            value="{{ request()->input()['filter']['*'] ?? '' }}"
                            placeholder="Search servers..."
                        >
                        <button type="submit" class="alx-admin-btn alx-admin-btn-search">
                            <i class="fa fa-search"></i> Search
                        </button>
                        <a href="{{ route('admin.servers.new') }}" class="alx-admin-btn alx-admin-btn-create">
                            <i class="fa fa-plus"></i> New Server
                        </a>
                    </div>
                </form>
            </div>

            <div style="overflow-x: auto;">
                <table class="alx-admin-table">
                    <thead>
                        <tr>
                            <th>Server</th>
                            <th>UUID</th>
                            <th>Owner</th>
                            <th>Node</th>
                            <th>Endpoint</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($servers as $server)
                            <tr>
                                <td class="alx-primary">
                                    <a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a>
                                </td>
                                <td><code title="{{ $server->uuid }}">{{ $server->uuidShort }}&hellip;</code></td>
                                <td>
                                    <a href="{{ route('admin.users.view', $server->user->id) }}">
                                        {{ $server->user->username }}
                                    </a>
                                </td>
                                <td>
                                    <a href="{{ route('admin.nodes.view', $server->node->id) }}">
                                        {{ $server->node->name }}
                                    </a>
                                </td>
                                <td><code>{{ $server->allocation->alias }}:{{ $server->allocation->port }}</code></td>
                                <td>
                                    @if($server->isSuspended())
                                        <span class="alx-status alx-status-suspended">
                                            <span class="alx-dot"></span> Suspended
                                        </span>
                                    @elseif(!$server->isInstalled())
                                        <span class="alx-status alx-status-installing">
                                            <span class="alx-dot"></span> Installing
                                        </span>
                                    @else
                                        <span class="alx-status alx-status-active">
                                            <span class="alx-dot"></span> Active
                                        </span>
                                    @endif
                                </td>
                                <td>
                                    <a class="alx-action" href="{{ route('admin.servers.view', $server->id) }}" title="Manage">
                                        <i class="fa fa-wrench"></i>
                                    </a>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="alx-admin-empty">
                                    <i class="fa fa-server"></i>
                                    <p>No servers found</p>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            @if($servers->hasPages())
                <div class="alx-admin-pager">
                    {!! $servers->appends(['filter' => Request::input('filter')])->render() !!}
                </div>
            @endif
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        // Subtle hover row highlight
        document.querySelectorAll('.alx-admin-table tbody tr').forEach(function(row) {
            row.addEventListener('mouseenter', function() {
                this.style.borderLeft = '2px solid rgba(229,9,20,0.4)';
            });
            row.addEventListener('mouseleave', function() {
                this.style.borderLeft = '';
            });
        });
    </script>
@endsection
