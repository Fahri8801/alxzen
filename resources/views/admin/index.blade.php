@extends('layouts.admin')

@section('title')
    Administration
@endsection

@section('content-header')
    <h1>Administrative Overview<small>A quick glance at your system.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Index</li>
    </ol>
@endsection

@section('content')
<style>
/* Alxzen Admin Overview Animations */
@keyframes alx-fade-in-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes alx-glow-pulse {
    0%, 100% { box-shadow: 0 0 8px rgba(124,58,237,0.2); }
    50%       { box-shadow: 0 0 24px rgba(124,58,237,0.6); }
}
@keyframes alx-scanline {
    0%   { background-position: 0 0; }
    100% { background-position: 0 100%; }
}
@keyframes alx-count-up {
    from { opacity: 0; transform: scale(0.8); }
    to   { opacity: 1; transform: scale(1); }
}
@keyframes alx-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
}
@keyframes alx-border-flow {
    0%, 100% { border-color: rgba(124,58,237,0.15); }
    50%       { border-color: rgba(124,58,237,0.5); }
}
.alx-overview-card {
    background: linear-gradient(145deg, #141414 0%, #0c0c0c 100%);
    border: 1px solid rgba(124,58,237,0.15);
    border-radius: 0;
    border-left: 3px solid #7c3aed;
    overflow: hidden;
    margin-bottom: 20px;
    animation: alx-fade-in-up 0.5s ease forwards, alx-border-flow 4s ease-in-out infinite;
    position: relative;
}
.alx-overview-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(255,255,255,0.01) 2px,
        rgba(255,255,255,0.01) 4px
    );
    pointer-events: none;
    z-index: 0;
}
.alx-overview-card.delay-1 { animation-delay: 0.1s; }
.alx-overview-card.delay-2 { animation-delay: 0.2s; }
.alx-overview-card > * { position: relative; z-index: 1; }
.alx-card-header-inner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(124,58,237,0.1);
    background: rgba(124,58,237,0.04);
}
.alx-card-header-inner h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: #e2e8f0;
    letter-spacing: 1px;
    text-transform: uppercase;
}
.alx-card-header-inner h3 i {
    color: #7c3aed;
    margin-right: 6px;
}
.alx-card-body { padding: 20px; }
.alx-card-body p, .alx-card-body li {
    color: #94a3b8;
    font-size: 13px;
    line-height: 1.7;
    margin: 0 0 8px 0;
}
.alx-card-body code {
    background: rgba(124,58,237,0.1);
    border: 1px solid rgba(124,58,237,0.2);
    border-radius: 3px;
    padding: 2px 7px;
    font-size: 11px;
    color: #fca5a5;
    font-family: 'JetBrains Mono', monospace;
}
.alx-card-body strong { color: #cbd5e1; }
.alx-label-red {
    background: rgba(124,58,237,0.15);
    border: 1px solid rgba(124,58,237,0.4);
    color: #fca5a5;
    border-radius: 0;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
}
.alx-label-green {
    background: rgba(34,197,94,0.12);
    border: 1px solid rgba(34,197,94,0.35);
    color: #4ade80;
    border-radius: 0;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
}
.alx-btn-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 10px;
}
.alx-link-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    border: none;
    border-radius: 0;
    cursor: pointer;
    text-decoration: none !important;
    transition: all 0.25s cubic-bezier(0.25,0.8,0.25,1);
    position: relative;
    overflow: hidden;
}
.alx-link-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%);
    background-size: 200% 100%;
    animation: alx-shimmer 3s infinite;
}
.alx-link-btn:hover {
    transform: translateY(-2px);
    text-decoration: none !important;
}
.alx-link-btn-orange {
    background: linear-gradient(135deg, #f97316, #ea580c);
    color: #fff;
    box-shadow: 0 4px 15px rgba(249,115,22,0.3);
}
.alx-link-btn-orange:hover {
    box-shadow: 0 8px 25px rgba(249,115,22,0.5);
    color: #fff;
}
.alx-link-btn-gray {
    background: linear-gradient(135deg, #374151, #1f2937);
    color: #d1d5db;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}
.alx-link-btn-gray:hover {
    background: linear-gradient(135deg, #4b5563, #374151);
    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    color: #fff;
}
.alx-link-btn-green {
    background: linear-gradient(135deg, #16a34a, #15803d);
    color: #fff;
    box-shadow: 0 4px 15px rgba(22,163,74,0.3);
}
.alx-link-btn-green:hover {
    box-shadow: 0 8px 25px rgba(22,163,74,0.5);
    color: #fff;
}
.alx-stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(124,58,237,0.07);
    border: 1px solid rgba(124,58,237,0.2);
    border-radius: 0;
    padding: 3px 10px;
    font-size: 11px;
    color: #94a3b8;
    animation: alx-count-up 0.6s ease forwards;
}
</style>

<div class="row">
    <div class="col-md-6">
        <div class="alx-overview-card delay-1">
            <div class="alx-card-header-inner">
                <h3><i class="fa fa-info-circle"></i>System Information</h3>
            </div>
            <div class="alx-card-body">
                <p>You are running <strong>Alxzen Panel</strong> version <code>{{ config('app.version') }}</code>. Your panel is up-to-date!</p>
            </div>
        </div>
    </div>

    <div class="col-md-6">
        <div class="alx-overview-card delay-2">
            <div class="alx-card-header-inner">
                <h3><i class="fa fa-shield"></i>Alxzen Panel Features</h3>
            </div>
            <div class="alx-card-body">
                <ul class="list-unstyled" style="margin:0;">
                    <li style="margin-bottom:8px;"><strong>Developed by:</strong> &nbsp;<span class="alx-label-red">{{ config('app.author') }}</span></li>
                    <li style="margin-bottom:8px;"><strong>Theme Version:</strong> &nbsp;<code>v{{ config('app.theme_version') }}</code></li>
                    <li style="margin-bottom:8px;"><strong>Protection:</strong> &nbsp;<span class="alx-label-green">Active (v{{ config('app.protect_version') }})</span></li>
                    <li style="margin-bottom:0;"><strong>Expiration Engine:</strong> &nbsp;<span class="alx-stat-pill"><i class="fa fa-clock-o"></i> v{{ config('app.expiration_version') }}</span></li>
                </ul>
            </div>
        </div>
    </div>
</div>

<div class="row" style="margin-bottom:20px;">
    <div class="col-xs-12">
        <div class="alx-btn-row">
            <a href="https://t.me/alxzy_group" target="_blank" class="alx-link-btn alx-link-btn-orange">
                <i class="fa fa-paper-plane"></i> Get Help via Telegram
            </a>
            <a href="https://github.com/alxzy-group" target="_blank" class="alx-link-btn alx-link-btn-gray">
                <i class="fa fa-github"></i> GitHub
            </a>
            <a href="https://saweria.co/ALANSTOREMD" target="_blank" class="alx-link-btn alx-link-btn-green">
                <i class="fa fa-heart"></i> Support Us
            </a>
        </div>
    </div>
</div>
</div>

<div class="row">
    <div class="col-md-12 text-center" style="margin-top: 10px;">
        <p class="text-muted" style="font-size:11px; letter-spacing:1px;"><strong>CREDITS: Based on Pterodactyl &mdash; Modified by Alxzen</strong></p>
    </div>
</div>
@endsection
