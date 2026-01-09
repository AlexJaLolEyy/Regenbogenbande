"use client";
import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faSortAmountDown, faLayerGroup } from "@fortawesome/free-solid-svg-icons";

export const Sidebar = () => {
    return (
        <aside className="hidden 2xl:block w-80 shrink-0 sticky top-32 h-[calc(100vh-8rem)] rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 shadow-2xl overflow-y-auto ml-6 mb-6">
            {/* Sidebar Section: Sort */}
            <div className="mb-8">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faSortAmountDown} /> Sort By
                </h3>
                <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/50 text-white text-sm font-medium cursor-pointer shadow-[0_0_15px_-5px_rgba(168,85,247,0.5)]">
                        Newest First
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-neutral-400 text-sm hover:bg-white/10 cursor-pointer transition">
                        Oldest First
                    </div>
                </div>
            </div>

            {/* Sidebar Section: Grouping */}
            <div className="mb-8">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faLayerGroup} /> Group By
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center text-neutral-400 text-xs hover:bg-white/10 cursor-pointer transition">
                        Date
                    </div>
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center text-purple-200 text-xs cursor-pointer transition">
                        Uploader
                    </div>
                </div>
            </div>

            {/* Sidebar Section: Filters */}
            <div>
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faFilter} /> Filter
                </h3>
                <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm text-neutral-300 cursor-pointer group">
                        <div className="w-5 h-5 rounded-md border border-white/20 bg-black/40 group-hover:border-purple-500/50 transition flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                        </div>
                        Verified Only
                    </label>
                    <label className="flex items-center gap-3 text-sm text-neutral-300 cursor-pointer group">
                        <div className="w-5 h-5 rounded-md border border-white/20 bg-black/40 group-hover:border-purple-500/50 transition"></div>
                        HD Quality
                    </label>
                </div>
            </div>
        </aside>
    );
};
