import React from 'react';
import { Mic, Image as ImageIcon, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
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
    <div className="hairline-card rounded-2xl p-5 sm:p-6 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold font-mono uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
            Muro de Ingestión (Gemini)
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Comprobantes, audios y tickets procesados automáticamente
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
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
              className="p-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-[var(--text-secondary)] mt-0.5">
                  {item.source_type === 'audio' && <Mic className="w-3.5 h-3.5" strokeWidth={1.75} />}
                  {item.source_type === 'image' && <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.75} />}
                  {item.source_type === 'text' && <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />}
                </div>
                <div>
                  <div className="font-medium text-[var(--text-primary)]">{item.concept || 'Gasto detectado'}</div>
                  <div className="font-semibold font-mono text-[var(--text-primary)] tabular-nums mt-0.5">$ {formattedAmount}</div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                    {new Date(item.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              {item.status === 'PENDING' && (
                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" strokeWidth={1.75} /> Pend
                </span>
              )}
              {item.status === 'PROCESSED' && (
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" strokeWidth={1.75} /> OK
                </span>
              )}
              {item.status === 'DISCARDED' && (
                <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3" strokeWidth={1.75} /> Desc
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
