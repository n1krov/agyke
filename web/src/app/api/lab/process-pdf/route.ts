import { NextResponse } from 'next/server';
import { parsePdfDocument } from '@/shared/services/multimodal/pdf-parser';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log('[LabAPI:Pdf] 📥 Petición recibida en /api/lab/process-pdf');

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.warn('[LabAPI:Pdf] ⚠️ No se encontró ningún archivo en la petición');
      return NextResponse.json(
        {
          success: false,
          error: 'No se adjuntó ningún archivo PDF en el campo "file".',
          executionTimeMs: Date.now() - startTime
        },
        { status: 400 }
      );
    }

    const mimeType = file.type || 'application/pdf';
    const fileName = file.name || 'documento.pdf';
    const fileSizeKb = (file.size / 1024).toFixed(1);

    console.log(`[LabAPI:Pdf] 📄 Archivo: "${fileName}" | Tipo: ${mimeType} | Tamaño: ${fileSizeKb} KB`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await parsePdfDocument(buffer, mimeType);

    console.log(`[LabAPI:Pdf] 🏁 Procesamiento completado en ${result.executionTimeMs} ms. Éxito: ${result.success}`);
    if (result.draft) {
      console.log(`[LabAPI:Pdf] 💰 Monto: $${result.draft.amount} | Concepto: "${result.draft.concept}" | Certeza: ${(result.draft.confidence * 100).toFixed(0)}%`);
    }

    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[LabAPI:Pdf] ❌ Error no controlado en /api/lab/process-pdf:', error);
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
