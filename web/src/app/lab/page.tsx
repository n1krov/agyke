'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Upload,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Clock,
  ArrowLeft,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Receipt,
  Building2,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import type { MultimodalProcessResponse } from '@/shared/types/multimodal';

export default function MultimodalLabPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [response, setResponse] = useState<MultimodalProcessResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen (JPEG, PNG, WebP)');
      return;
    }

    setSelectedFile(file);
    setResponse(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    console.log(`[Lab] 📁 Archivo cargado: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setElapsedTime(0);
    setResponse(null);

    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.round((Date.now() - start) / 100) / 10);
    }, 100);

    console.log(`[Lab] 🚀 Iniciando envío de "${selectedFile.name}" a /api/lab/process-receipt...`);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/lab/process-receipt', {
        method: 'POST',
        body: formData
      });

      const data: MultimodalProcessResponse = await res.json();

      if (timerRef.current) clearInterval(timerRef.current);
      setResponse(data);

      console.group('%c[Lab] 🏁 Resultado de Procesamiento Multimodal', 'color: #818cf8; font-weight: bold;');
      console.log('Éxito:', data.success);
      console.log('Tiempo de Ejecución:', `${data.executionTimeMs} ms`);
      if (data.draft) {
        console.log('Draft Contable:', data.draft);
      }
      if (data.debugLogs) {
        console.log('Logs del Servidor:', data.debugLogs);
      }
      if (data.error) {
        console.error('Error reportado:', data.error);
      }
      console.groupEnd();
    } catch (err: unknown) {
      if (timerRef.current) clearInterval(timerRef.current);
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[Lab] ❌ Error de red o petición:', errMsg);
      setResponse({
        success: false,
        error: `Error de conexión: ${errMsg}`,
        executionTimeMs: Date.now() - start
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResponse(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyJson = () => {
    if (!response?.draft) return;
    navigator.clipboard.writeText(JSON.stringify(response.draft, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper para generar una muestra de prueba simulada si no tiene foto a mano
  const handleLoadSample = async () => {
    try {
      // Crear un canvas con un ticket dibujado simple para probar de inmediato
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 500);

        ctx.fillStyle = '#111827';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SUPERMERCADO DIA %', 200, 50);

        ctx.font = '14px monospace';
        ctx.fillText('CUIT: 30-68584975-1', 200, 75);
        ctx.fillText('AV. CORRIENTES 3400 - CABA', 200, 95);
        ctx.fillText('FECHA: 28/09/2026  HORA: 20:45', 200, 120);

        ctx.textAlign = 'left';
        ctx.fillText('--------------------------------------', 20, 140);
        ctx.fillText('1x LECHE DESCREMADA 1L       $ 1.450,00', 25, 170);
        ctx.fillText('2x YOGUR ENTERO FRUTILLA     $ 3.200,00', 25, 200);
        ctx.fillText('1x PAN DE MOLDE BLANCO       $ 2.800,00', 25, 230);
        ctx.fillText('1x QUESO CREMOSO 500G        $ 5.900,00', 25, 260);
        ctx.fillText('--------------------------------------', 20, 290);
        ctx.fillText('SUBTOTAL:                   $ 13.350,00', 25, 320);
        ctx.fillText('DESC. PROMO BANCARIA 20%:   -$ 2.670,00', 25, 350);
        ctx.fillText('--------------------------------------', 20, 380);

        ctx.font = 'bold 20px monospace';
        ctx.fillText('TOTAL A PAGAR:        $ 10.680,00', 25, 420);

        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SU PAGO CON DÉBITO VISA', 200, 460);
        ctx.fillText('*** GRACIAS POR SU COMPRA ***', 200, 480);

        canvas.toBlob((blob) => {
          if (blob) {
            const sampleFile = new File([blob], 'ticket_ejemplo_dia.jpg', { type: 'image/jpeg' });
            handleFileSelect(sampleFile);
          }
        }, 'image/jpeg');
      }
    } catch (e) {
      console.error('Error generando sample:', e);
    }
  };

  const draft = response?.draft;

  return (
    <div className="min-h-screen bg-[#080B11] text-[#F8FAFC]">
      {/* Barra de Navegación del Laboratorio */}
      <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/[0.08] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-sm font-medium transition-colors border border-white/[0.06]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-white">Multimodal Lab</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Experimento Local
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Generar Ticket de Prueba</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner de Bienvenida y Contexto */}
        <section className="glass-panel p-6 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-indigo-950/20 via-slate-900/40 to-slate-950/40 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Receipt className="w-6 h-6 text-indigo-400" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Laboratorio de Comprobantes e Imágenes
                </h1>
              </div>
              <p className="text-sm text-slate-400 max-w-2xl">
                Prueba interactiva del pipeline de ingestión visual con Gemini 1.5 Flash. Arrastra una foto de un ticket de compra o factura física y observa cómo se normaliza hacia el contrato canónico <code className="text-indigo-300 font-mono text-xs">ExtractedExpenseDraft</code>.
              </p>
            </div>

            {/* Badges de soporte multimedia */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Imágenes (Activo)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-white/5 font-medium">
                Audio (Próximamente)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-white/5 font-medium">
                PDF (Próximamente)
              </span>
            </div>
          </div>
        </section>

        {/* Grid de Dos Columnas: Input vs Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Carga y Preview del Archivo */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/[0.08] space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                1. Selección de Comprobante
              </h2>

              {/* Zona de Drag & Drop */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-500/10'
                    : 'border-white/10 hover:border-indigo-500/40 hover:bg-slate-900/40 bg-slate-950/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
                  <FileImage className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Arrastra aquí la foto del ticket o haz clic para buscar
                </p>
                <p className="text-xs text-slate-500 mt-1">Soporta JPEG, PNG o WebP (hasta 8 MB)</p>
              </div>

              {/* Preview de la imagen si está seleccionada */}
              {previewUrl && selectedFile && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[200px] font-mono">{selectedFile.name}</span>
                    <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    <button
                      onClick={handleReset}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Quitar
                    </button>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 max-h-[320px] flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Preview comprobante"
                      className="object-contain max-h-[320px] w-full"
                    />
                  </div>

                  {/* Botón de Inferencia */}
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    type="button"
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                      isProcessing
                        ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Analizando con Gemini 1.5 Flash ({elapsedTime.toFixed(1)}s)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>⚡ Procesar Comprobante</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Tarjeta Financiera y Visor de Debug */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/[0.08] space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  2. Resultado y Extracción Canónica
                </h2>
                {response && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" /> {response.executionTimeMs} ms
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${
                        response.success
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {response.success ? 'Extracción OK' : 'Fallo'}
                    </span>
                  </div>
                )}
              </div>

              {/* Estado: Esperando archivo */}
              {!selectedFile && !response && (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <Layers className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
                  <p className="text-sm">Selecciona o arrastra una imagen a la izquierda para comenzar.</p>
                  <p className="text-xs text-slate-600">Puedes usar el botón &quot;Generar Ticket de Prueba&quot; si no tienes uno a mano.</p>
                </div>
              )}

              {/* Estado: Procesando */}
              {isProcessing && (
                <div className="py-16 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-200">
                      Gemini 1.5 Flash está analizando la imagen...
                    </p>
                    <p className="text-xs text-slate-500">
                      Extrayendo Total a Pagar, Comercio, Fecha y Descuentos aplicados
                    </p>
                  </div>
                </div>
              )}

              {/* Estado: Error */}
              {response && !response.success && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-2">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Error al procesar el comprobante</span>
                  </div>
                  <p className="text-xs text-rose-300/80 font-mono">{response.error}</p>
                </div>
              )}

              {/* Estado: Éxito con Draft Financiero */}
              {draft && (
                <div className="space-y-6">
                  {/* Tarjeta de Visualización Financiera Agyke */}
                  <div className="p-5 rounded-xl bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-indigo-500/20 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                          Total Extraído
                        </span>
                        <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums mt-0.5">
                          ${' '}
                          {draft.amount.toLocaleString('es-AR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                          <span className="text-xs font-normal text-slate-400 ml-2">
                            {draft.metadata?.currency || 'ARS'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-medium text-slate-400 block">Certeza</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mt-1">
                          {Math.round(draft.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Metadatos en Grilla */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/[0.06] text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-slate-400">Concepto / Local:</span>
                        <span className="font-semibold text-white truncate">
                          {draft.concept}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-slate-400">Fecha Detectada:</span>
                        <span className="font-semibold text-white">
                          {draft.date || 'No identificada'}
                        </span>
                      </div>

                      {draft.metadata?.merchant && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Receipt className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-slate-400">Razón Social:</span>
                          <span className="font-mono text-white truncate">
                            {draft.metadata.merchant}
                          </span>
                        </div>
                      )}

                      {draft.metadata?.invoice_number && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-slate-400">N° Ticket/Factura:</span>
                          <span className="font-mono text-white">
                            {draft.metadata.invoice_number}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Transcripción / Resumen */}
                    {draft.raw_transcription && (
                      <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 text-xs space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          🗣️ Resumen Contable Detectado
                        </span>
                        <p className="text-slate-300 italic font-sans leading-relaxed">
                          &quot;{draft.raw_transcription}&quot;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Inspector de JSON Canónico y Logs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        JSON Canónico Serializado (`ExtractedExpenseDraft`)
                      </span>
                      <button
                        onClick={handleCopyJson}
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar JSON</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-emerald-400 overflow-x-auto max-h-64 leading-relaxed">
                      {JSON.stringify(draft, null, 2)}
                    </pre>

                    {/* Logs de Depuración del Servidor */}
                    {response.debugLogs && response.debugLogs.length > 0 && (
                      <details className="text-xs group">
                        <summary className="cursor-pointer text-slate-400 hover:text-slate-300 font-medium py-1 select-none flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Ver {response.debugLogs.length} logs de depuración del backend</span>
                        </summary>
                        <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-white/5 font-mono text-[11px] text-slate-400 space-y-1 max-h-48 overflow-y-auto">
                          {response.debugLogs.map((log, index) => (
                            <div key={index} className="leading-snug">
                              {log}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
