import React from 'react';
import { Loader2, Layers } from 'lucide-react';

interface WorkspaceLoadingFallbackProps {
  moduleName?: string;
  moduleCode?: string;
}

export const WorkspaceLoadingFallback: React.FC<WorkspaceLoadingFallbackProps> = ({
  moduleName,
  moduleCode,
}) => {
  return (
    <div className="w-full space-y-6 animate-pulse" id="workspace-lazy-fallback">
      {/* Top Banner Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {moduleCode && (
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                  {moduleCode}
                </span>
              )}
              <h2 className="text-base font-bold text-slate-900">
                {moduleName ? `Đang tải phân hệ ${moduleName}...` : 'Đang tải Workspace...'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Đồng bộ dữ liệu L2-L4 • NexusSync Authoritative Core
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-slate-100 rounded-xl" />
          <div className="h-9 w-32 bg-blue-100 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-200 rounded" />
              <div className="w-7 h-7 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-7 w-20 bg-slate-200 rounded font-mono" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="h-9 w-64 bg-slate-100 rounded-xl" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 bg-slate-100 rounded-xl" />
            <div className="h-9 w-24 bg-slate-100 rounded-xl" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-4 h-4 bg-slate-200 rounded" />
                <div className="h-4 w-28 bg-slate-200 rounded font-mono" />
                <div className="h-4 w-48 bg-slate-100 rounded" />
              </div>
              <div className="h-4 w-24 bg-slate-100 rounded font-mono" />
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
              <div className="h-8 w-16 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
