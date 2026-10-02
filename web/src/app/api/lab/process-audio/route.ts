import { NextResponse } from 'next/server';
import { parseAudioMessage } from '@/shared/services/multimodal/audio-parser';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log('[LabAPI:Audio] 📥 Petición recibida en /api/lab/process-audio');

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.warn('[LabAPI:Audio] ⚠️ No se encontró ningún archivo en la petición');
      return NextResponse.json(
        {
          success: false,
          error: 'No se adjuntó ningún archivo de audio en el campo "file".',
          executionTimeMs: Date.now() - startTime
        },
        { status: 400 }
      );
    }

    const mimeType = file.type || 'audio/ogg';
    const fileName = file.name || 'audio.ogg';
    const fileSizeKb = (file.size / 1024).toFixed(1);

    console.log(`[LabAPI:Audio] 🎙️ Archivo: "${fileName}" | Tipo: ${mimeType} | Tamaño: ${fileSizeKb} KB`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await parseAudioMessage(buffer, mimeType);

    console.log(`[LabAPI:Audio] 🏁 Procesamiento completado en ${result.executionTimeMs} ms. Éxito: ${result.success}`);
    if (result.draft) {
      console.log(`[LabAPI:Audio] 💰 Monto: $${result.draft.amount} | Concepto: "${result.draft.concept}" | Certeza: ${(result.draft.confidence * 100).toFixed(0)}%`);
    }

    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[LabAPI:Audio] ❌ Error no controlado en /api/lab/process-audio:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Error interno del servidor: ${error}`,
        executionTimeMs: Date.now() - startTime,
        debugLogs: [`[CRITICAL] ${error}`]
      },
      { status: 500 }
    );
  }
}
