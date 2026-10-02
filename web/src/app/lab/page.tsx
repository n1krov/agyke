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
  FileText,
  Mic,
  FileAudio,
  UserCheck,
  Scale
} from 'lucide-react';
import type { MultimodalProcessResponse } from '@/shared/types/multimodal';

type Modality = 'image' | 'audio' | 'pdf';

interface ModalityConfig {
  id: Modality;
  label: string;
  icon: React.ReactNode;
  accept: string;
  apiEndpoint: string;
  description: string;
  allowedTypes: string[];
}

const MODALITIES: ModalityConfig[] = [
  {
    id: 'image',
    label: 'Comprobantes e Imágenes',
    icon: <FileImage className="w-4 h-4" />,
    accept: 'image/jpeg,image/png,image/webp',
    apiEndpoint: '/api/lab/process-receipt',
    description: 'Tickets de supermercado, recibos de farmacia, comprobantes impresos (JPEG, PNG, WebP)',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'audio',
    label: 'Notas de Voz y Audio',
    icon: <Mic className="w-4 h-4" />,
    accept: 'audio/ogg,audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/x-m4a',
    apiEndpoint: '/api/lab/process-audio',
    description: 'Notas de voz de Telegram y audios cotidianos ("Gasté 15 lucas en Coto mitad y mitad")',
    allowedTypes: ['audio/ogg', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a', 'audio/webm']
  },
  {
    id: 'pdf',
    label: 'Facturas Digitales (PDF)',
    icon: <FileText className="w-4 h-4" />,
    accept: 'application/pdf',
    apiEndpoint: '/api/lab/process-pdf',
    description: 'Facturas AFIP A/B/C, comprobantes de Mercado Pago, transferencias y servicios (Edenor, Metrogas)',
    allowedTypes: ['application/pdf']
  }
];

export default function MultimodalLabPage() {
  const [activeTab, setActiveTab] = useState<Modality>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [response, setResponse] = useState<MultimodalProcessResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentConfig = MODALITIES.find((m) => m.id === activeTab) || MODALITIES[0];

  const handleTabChange = (newTab: Modality) => {
    setActiveTab(newTab);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResponse(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (file: File) => {
    const isAllowed = currentConfig.allowedTypes.some((t) => file.type.includes(t) || file.type.startsWith(t.split('/')[0]));
    const isExtensionMatch =
      (activeTab === 'image' && /\.(jpe?g|png|webp)$/i.test(file.name)) ||
      (activeTab === 'audio' && /\.(ogg|mp3|wav|m4a|aac)$/i.test(file.name)) ||
      (activeTab === 'pdf' && /\.pdf$/i.test(file.name));

    if (!isAllowed && !isExtensionMatch) {
      alert(`Por favor selecciona un archivo compatible con ${currentConfig.label}`);
      return;
    }

    setSelectedFile(file);
    setResponse(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    console.log(`[Lab] 📁 [${activeTab.toUpperCase()}] Archivo cargado: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
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

    console.log(`[Lab] 🚀 Enviando "${selectedFile.name}" a ${currentConfig.apiEndpoint}...`);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(currentConfig.apiEndpoint, {
        method: 'POST',
        body: formData
      });

      const data: MultimodalProcessResponse = await res.json();

      if (timerRef.current) clearInterval(timerRef.current);
      setResponse(data);

      console.group(`%c[Lab] 🏁 Resultado Inferencia (${activeTab.toUpperCase()})`, 'color: #818cf8; font-weight: bold;');
      console.log('Éxito:', data.success);
      console.log('Tiempo de Ejecución:', `${data.executionTimeMs} ms`);
      if (data.draft) console.log('Draft Contable:', data.draft);
      if (data.debugLogs) console.log('Logs del Servidor:', data.debugLogs);
      if (data.error) console.error('Error reportado:', data.error);
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

  // Helper para generar una muestra demo rápida según la pestaña activa
  const handleLoadSample = async () => {
    if (activeTab === 'image') {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('SUPERMERCADO COTO', 90, 50);
        ctx.font = '13px monospace';
        ctx.fillText('SUC. 042 - CABALLITO', 120, 80);
        ctx.fillText('FECHA: 28/09/2026 18:42', 100, 110);
        ctx.fillText('--------------------------------', 40, 140);
        ctx.fillText('1x LECHE LA SERENISIMA    $1.850,00', 40, 170);
        ctx.fillText('2x YERBA PLAYADITO 1KG    $9.200,00', 40, 200);
        ctx.fillText('1x QUESO CREMOSO 500G     $4.900,50', 40, 230);
        ctx.fillText('1x PAN LACTAL FAMILIAR    $2.500,00', 40, 260);
        ctx.fillText('--------------------------------', 40, 300);
        ctx.font = 'bold 18px monospace';
        ctx.fillText('TOTAL: $18.450,50', 100, 340);
        ctx.font = '12px monospace';
        ctx.fillText('PAGADO CON TARJETA DEBITO VISA', 70, 380);
        ctx.fillText('AFIP COD AUT: 94827103849', 90, 420);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'ticket_coto_sample.jpg', { type: 'image/jpeg' });
            handleFileSelect(file);
          }
        }, 'image/jpeg');
      }
    } else if (activeTab === 'audio') {
      // Crear un audio sintetizado breve (Web Audio API)
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const duration = 2.0;
        const sampleRate = audioCtx.sampleRate;
        const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
          data[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.1;
        }

        // Convertir audio buffer simple a WAV Blob
        const wavBlob = audioBufferToWav(buffer);
        const file = new File([wavBlob], 'audio_demo_quince_lucas.wav', { type: 'audio/wav' });
        handleFileSelect(file);
      } catch (err) {
        console.error('Error generando audio de prueba:', err);
      }
    } else if (activeTab === 'pdf') {
      // Generar un PDF demo sintético mínimo válido
      const samplePdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 145 >> stream
BT
/F1 18 Tf 50 700 Td (FACTURA AFIP B - EDENOR S.A.) Tj
/F1 14 Tf 50 660 Td (Fecha: 25/09/2026 - Total a Pagar: $24.850,00) Tj
ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
412
%%EOF`;
      const blob = new Blob([samplePdfContent], { type: 'application/pdf' });
      const file = new File([blob], 'factura_edenor_sample.pdf', { type: 'application/pdf' });
      handleFileSelect(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 bg-gradient-radial selection:bg-indigo-500/30 selection:text-white pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/[0.08] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-medium"
              title="Volver al Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-base font-bold text-white tracking-tight">Multimodal Lab</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Playground 3-en-1
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Entorno Experimental de Ingestión
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Selector de Pestañas Multimodal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MODALITIES.map((mod) => {
            const isActive = activeTab === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => handleTabChange(mod.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                  isActive
                    ? 'glass-panel border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                    : 'glass-panel-subtle border-white/5 hover:border-white/15 opacity-70 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {mod.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white tracking-tight truncate">{mod.label}</p>
                  <p className="text-xs text-slate-400 truncate">{mod.id === 'image' ? 'Fotos & Tickets' : mod.id === 'audio' ? 'Voz & Audios' : 'Facturas AFIP'}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Panel Central 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Input & Preview (5 columnas) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  {currentConfig.icon}
                  <span>Carga de {currentConfig.label}</span>
                </h2>
                {selectedFile && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-4">{currentConfig.description}</p>

              {/* Dropzone */}
              <input
                ref={fileInputRef}
                type="file"
                accept={currentConfig.accept}
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/10 hover:border-white/20 bg-slate-900/40 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Arrastrá tu archivo o hacé clic para explorar</p>
                    <p className="text-xs text-slate-500 mt-1">Soporta: {currentConfig.accept}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadSample();
                    }}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-xs font-medium text-indigo-300 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cargar {activeTab === 'image' ? 'Ticket' : activeTab === 'audio' ? 'Audio' : 'Factura'} Demo</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview según modalidad */}
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-950/60 p-3">
                    {activeTab === 'image' && previewUrl && (
                      <div className="relative aspect-[3/4] w-full max-h-72 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt="Comprobante" className="object-contain w-full h-full" />
                      </div>
                    )}

                    {activeTab === 'audio' && previewUrl && (
                      <div className="p-4 flex flex-col items-center justify-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                          <FileAudio className="w-7 h-7" />
                        </div>
                        <p className="text-xs text-slate-300 font-medium truncate max-w-xs">{selectedFile.name}</p>
                        <audio controls src={previewUrl} className="w-full h-10 mt-2" />
                      </div>
                    )}

                    {activeTab === 'pdf' && (
                      <div className="p-6 flex flex-col items-center justify-center space-y-2 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
                          <FileText className="w-7 h-7" />
                        </div>
                        <p className="text-sm text-white font-semibold truncate max-w-xs">{selectedFile.name}</p>
                        <span className="text-xs text-slate-400">Documento PDF listo para extracción</span>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                      <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                      <span className="tabular-nums font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>

                  {/* Botón de Procesar */}
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isProcessing ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Inferencia con Gemini... ({elapsedTime}s)</span>
                      </span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Procesar {activeTab === 'image' ? 'Comprobante' : activeTab === 'audio' ? 'Audio' : 'Factura'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Guía Rápida */}
            <div className="glass-panel-subtle rounded-2xl p-4 border border-white/5 text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-300">💡 Qué analiza Gemini en esta modalidad:</p>
              {activeTab === 'image' && (
                <ul className="list-disc pl-4 space-y-1">
                  <li>Total pagado (omite subtotales y CUIT).</li>
                  <li>Nombre del comercio o emisor.</li>
                  <li>Fecha de emisión en formato YYYY-MM-DD.</li>
                </ul>
              )}
              {activeTab === 'audio' && (
                <ul className="list-disc pl-4 space-y-1">
                  <li>Transcripción literal de lo hablado.</li>
                  <li>Modismos argentinos (&quot;lucas&quot;, &quot;palos&quot;).</li>
                  <li>Deducción de deuda (&quot;mitad y mitad&quot; = 50, &quot;favor&quot; = 100).</li>
                </ul>
              )}
              {activeTab === 'pdf' && (
                <ul className="list-disc pl-4 space-y-1">
                  <li>Facturas electrónicas AFIP A/B/C.</li>
                  <li>Comprobantes de transferencia de Mercado Pago.</li>
                  <li>Facturas de servicios públicos y expensas.</li>
                </ul>
              )}
            </div>
          </div>

          {/* Columna Derecha: Resultados & Logs (7 columnas) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Tarjeta de Resultado Contable */}
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-white">Borrador Contable Estructurado</h2>
                </div>
                {response?.draft && (
                  <button
                    onClick={handleCopyJson}
                    className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar JSON'}</span>
                  </button>
                )}
              </div>

              {!response ? (
                <div className="h-64 rounded-xl border border-white/5 bg-slate-950/40 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <Clock className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs">Cargá un archivo a la izquierda y presioná &quot;Procesar&quot;</p>
                  <p className="text-[11px] text-slate-600 mt-1">Los datos extraídos aparecerán aquí formateados</p>
                </div>
              ) : response.success && response.draft ? (
                <div className="space-y-4 animate-fade-in">
                  {/* Status Banner */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold">Inferencia Completada con Éxito</span>
                    </div>
                    <span className="font-mono tabular-nums text-slate-400">{response.executionTimeMs} ms</span>
                  </div>

                  {/* KPI Cards del Draft */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Monto Detectado</span>
                      <p className="text-2xl font-bold text-white tabular-nums mt-0.5">
                        ${response.draft.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[11px] text-slate-500 font-mono">{response.draft.metadata?.currency || 'ARS'}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Concepto / Emisor</span>
                      <p className="text-lg font-bold text-indigo-300 truncate mt-0.5" title={response.draft.concept}>
                        {response.draft.concept}
                      </p>
                      <span className="text-[11px] text-slate-500">
                        {response.draft.metadata?.merchant ? `Comercio: ${response.draft.metadata.merchant}` : 'Descripción asignada'}
                      </span>
                    </div>
                  </div>

                  {/* Campos Secundarios */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Fecha
                      </span>
                      <p className="font-medium text-slate-200 mt-0.5">{response.draft.date || 'No detectada'}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Scale className="w-3 h-3" /> Clasificación
                      </span>
                      <p className="font-semibold text-emerald-400 mt-0.5">
                        {response.draft.suggested_classification ? `${response.draft.suggested_classification}%` : 'A elegir en bot'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Pagador
                      </span>
                      <p className="font-medium text-slate-200 mt-0.5 truncate">{response.draft.payer_hint || 'No inferido'}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Certeza (AI)
                      </span>
                      <p className="font-semibold text-indigo-300 mt-0.5 tabular-nums">
                        {(response.draft.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Transcripción / Resumen */}
                  {response.draft.raw_transcription && (
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                        {activeTab === 'audio' ? 'Transcripción de la Nota de Voz' : 'Resumen Textual / OCR'}
                      </span>
                      <p className="text-slate-300 mt-1 italic">&quot;{response.draft.raw_transcription}&quot;</p>
                    </div>
                  )}

                  {/* Metadata extra si existe */}
                  {response.draft.metadata?.invoice_number && (
                    <div className="p-3 rounded-xl bg-slate-900/30 border border-white/5 flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>N° Comprobante:</span>
                        <span className="font-mono text-slate-200">{response.draft.metadata.invoice_number}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-semibold">Error en la Inferencia Multimodal</span>
                  </div>
                  <p className="text-slate-400">{response.error || 'Ocurrió un error inesperado al procesar el archivo.'}</p>
                  <p className="text-[11px] text-slate-500">Tiempo transcurrido: {response.executionTimeMs} ms</p>
                </div>
              )}
            </div>

            {/* Consola de Telemetría & Debug Logs */}
            <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] font-mono text-xs">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5 text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px] uppercase font-semibold tracking-wider">Telemetría & Server Logs</span>
                </div>
                <span className="text-[10px] text-slate-500">Node.js Serverless Function</span>
              </div>

              <div className="h-44 overflow-y-auto bg-slate-950/80 rounded-xl p-3 border border-white/5 text-slate-300 space-y-1">
                {!response?.debugLogs || response.debugLogs.length === 0 ? (
                  <p className="text-slate-600 text-[11px] italic">Esperando ejecución para transmitir logs de depuración...</p>
                ) : (
                  response.debugLogs.map((log, idx) => {
                    const isError = log.includes('❌') || log.includes('[CRITICAL]');
                    const isWarn = log.includes('⚠️');
                    const isSuccess = log.includes('✅');
                    return (
                      <p
                        key={idx}
                        className={`text-[11px] leading-relaxed break-all ${
                          isError ? 'text-rose-400' : isWarn ? 'text-amber-300' : isSuccess ? 'text-emerald-400' : 'text-slate-300'
                        }`}
                      >
                        {log}
                      </p>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper para convertir AudioBuffer simple a WAV Blob en navegador
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16);
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}
