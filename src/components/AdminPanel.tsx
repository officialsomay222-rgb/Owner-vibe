import React, { useState, useEffect } from 'react';
import { ConfigService, GlobalConfig } from '../services/ConfigService';
import { ActionButton } from './SettingsUI';
import { Save, Server, Shield, Globe, Activity, CheckCircle, RefreshCcw } from 'lucide-react';
import { Logger } from '../utils/logger';

export default function AdminPanel() {
    const [config, setConfig] = useState<GlobalConfig>({
        useVeromeApi: false,
        proxyDomain: '',
        veromeApiBaseUrl: '',
        rapidApiKey: '',
        useYoutubeiApi: false
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const data = await ConfigService.getConfig(true);
            setConfig(data);
        } catch (error) {
            Logger.error('Failed to load admin config', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await ConfigService.updateConfig(config);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            Logger.error('Failed to save config', error);
            alert('Failed to save configuration. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#050505]">
                <div className="flex flex-col items-center">
                    <RefreshCcw className="w-8 h-8 text-[#00d2ff] animate-spin mb-4" />
                    <span className="text-[#888] font-medium tracking-wide">Loading Config...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020202] text-white p-5 md:p-10 font-sans selection:bg-[#00d2ff]/30">
            <div className="max-w-2xl mx-auto pt-safe pb-safe">
                <div className="flex items-center space-x-3 mb-10">
                    <div className="p-3 bg-[#00d2ff]/10 rounded-2xl border border-[#00d2ff]/20">
                        <Shield className="w-8 h-8 text-[#00d2ff]" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-[#f0f0f0] to-[#aaa] drop-shadow-sm">Admin Panel</h1>
                        <p className="text-[#888] font-medium">Global Configuration Management</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* API Selection Section */}
                    <div className="bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 rounded-3xl p-6 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-white/[0.05]">
                            <Activity className="w-5 h-5 text-purple-400" />
                            <h2 className="text-xl font-bold tracking-wide">API Routing</h2>
                        </div>

                        <div className="flex flex-col space-y-4">
                            <label className="flex items-center space-x-3 p-3 rounded-xl border border-white/5 hover:bg-white/[0.02] cursor-pointer transition-all">
                                <input
                                    type="radio"
                                    name="apiProvider"
                                    value="verome"
                                    checked={config.useVeromeApi && !config.useYoutubeiApi}
                                    onChange={() => setConfig({ ...config, useVeromeApi: true, useYoutubeiApi: false })}
                                    className="w-5 h-5 accent-[#00d2ff]"
                                />
                                <div className="flex flex-col">
                                    <span className="font-bold text-white">Verome API</span>
                                    <span className="text-xs text-[#888]">Use the Verome proxy for search and streaming</span>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 p-3 rounded-xl border border-white/5 hover:bg-white/[0.02] cursor-pointer transition-all">
                                <input
                                    type="radio"
                                    name="apiProvider"
                                    value="youtubei"
                                    checked={config.useYoutubeiApi}
                                    onChange={() => setConfig({ ...config, useYoutubeiApi: true, useVeromeApi: false })}
                                    className="w-5 h-5 accent-[#00d2ff]"
                                />
                                <div className="flex flex-col">
                                    <span className="font-bold text-white">YouTubei API Proxy</span>
                                    <span className="text-xs text-[#888]">Route traffic through YouTube.js Netlify Edge Function</span>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 p-3 rounded-xl border border-white/5 hover:bg-white/[0.02] cursor-pointer transition-all">
                                <input
                                    type="radio"
                                    name="apiProvider"
                                    value="fallback"
                                    checked={!config.useVeromeApi && !config.useYoutubeiApi}
                                    onChange={() => setConfig({ ...config, useVeromeApi: false, useYoutubeiApi: false })}
                                    className="w-5 h-5 accent-[#00d2ff]"
                                />
                                <div className="flex flex-col">
                                    <span className="font-bold text-white">Fallback (RapidAPI / Ytify)</span>
                                    <span className="text-xs text-[#888]">Use default fallback Edge Functions and APIs</span>
                                </div>
                            </label>
                        </div>


                        <div className="mt-6 border-t border-white/[0.05] pt-6 flex flex-col space-y-2">
                            <label className="text-[14px] font-bold text-[#888] tracking-wide ml-1">Verome API Base URL</label>
                            <input
                                type="text"
                                value={config.veromeApiBaseUrl || ''}
                                onChange={(e) => setConfig({ ...config, veromeApiBaseUrl: e.target.value })}
                                placeholder="https://verome-api.deno.dev"
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00d2ff]/50 focus:border-transparent focus:bg-white/[0.05] transition-all font-medium tracking-wide placeholder-[#666] shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Proxy Settings Section */}
                    <div className="bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 rounded-3xl p-6 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-white/[0.05]">
                            <Globe className="w-5 h-5 text-emerald-400" />
                            <h2 className="text-xl font-bold tracking-wide">Stream Proxy</h2>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <label className="text-[14px] font-bold text-[#888] tracking-wide ml-1">Proxy Domain (Invidious/Bypass)</label>
                            <input
                                type="text"
                                value={config.proxyDomain || ''}
                                onChange={(e) => setConfig({ ...config, proxyDomain: e.target.value })}
                                placeholder="https://yt.omada.cafe"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-emerald-500/50 focus:border-transparent focus:bg-white/[0.02] transition-all font-medium tracking-wide placeholder-[#555]"
                            />
                            <p className="text-[13px] text-[#666] ml-1 mt-1">Used to rewrite googlevideo.com URLs to bypass 403 blocks.</p>
                        </div>
                    </div>

                     {/* Additional API Keys Section */}
                     <div className="bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 rounded-3xl p-6 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-white/[0.05]">
                            <Server className="w-5 h-5 text-orange-400" />
                            <h2 className="text-xl font-bold tracking-wide">External Keys</h2>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <label className="text-[14px] font-bold text-[#888] tracking-wide ml-1">RapidAPI Key (Optional override)</label>
                            <input
                                type="password"
                                value={config.rapidApiKey || ''}
                                onChange={(e) => setConfig({ ...config, rapidApiKey: e.target.value })}
                                placeholder="Enter RapidAPI Key"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-orange-500/50 focus:border-transparent focus:bg-white/[0.02] transition-all font-medium tracking-wide placeholder-[#555]"
                            />
                        </div>
                    </div>

                    <div className="pt-4 pb-12">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`w-full flex items-center justify-center space-x-2 py-4 rounded-xl font-bold tracking-wide transition-all shadow-lg ${
                                saveSuccess
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                    : 'bg-gradient-to-r from-[#00d2ff] to-[#00a0ff] text-black hover:opacity-90 active:scale-[0.98]'
                            }`}
                        >
                            {isSaving ? (
                                <RefreshCcw className="w-5 h-5 animate-spin" />
                            ) : saveSuccess ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Settings Applied Globally</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Save & Apply Configuration</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
