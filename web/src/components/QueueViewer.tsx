import React from 'react';
import { Mic, Image as ImageIcon, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import type { AgykeItem } from '../types/database';

interface QueueViewerProps {
  queueItems: AgykeItem[];
}

export const QueueViewer: React.FC<QueueViewerProps> = ({ queueItems }) => {
  if (!queueItems || queueItems.length === 0) {
    return null;
  }

  const pendingCount = queueItems.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/[0.08]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Muro Agyke (Pipeline Inteligente Gemini)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprobantes, audios y tickets procesados automáticamente
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
            {pendingCount} Pendiente{pendingCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {queueItems.slice(0, 6).map((item) => {
          const formattedAmount = Number(item.amount).toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          return (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-slate-900/40 border border-white/5 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 mt-0.5">
                  {item.source_type === 'audio' && <Mic className="w-4 h-4" />}
                  {item.source_type === 'image' && <ImageIcon className="w-4 h-4" />}
                  {item.source_type === 'text' && <FileText className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-semibold text-white">{item.concept || 'Gasto detectado'}</div>
                  <div className="text-indigo-300 font-bold tabular-nums mt-0.5">$ {formattedAmount}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {new Date(item.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              <div>
                {item.status === 'PENDING' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="w-3 h-3" /> Pendiente
                  </span>
                )}
                {item.status === 'PROCESSED' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3 h-3" /> Procesado
                  </span>
                )}
                {item.status === 'DISCARDED' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <XCircle className="w-3 h-3" /> Descartado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
