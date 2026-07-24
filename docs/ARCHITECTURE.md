# ARCHITECTURE.md - Especificación Técnica y Esquema de Datos

## 1. DDL Completo de Base de Datos (SQL para Supabase)

Ejecutar el siguiente script completo en el editor SQL de Supabase:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Muro Agyke (Cola de Pendientes)
CREATE TABLE agyke_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    concept TEXT,
    file_path TEXT,
    source_type TEXT NOT NULL CHECK (source_type IN ('audio', 'image', 'text')),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'DISCARDED')),
    telegram_message_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transacciones Procesadas
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    concept TEXT,
    classification TEXT NOT NULL CHECK (classification IN ('50', '100', '-100', '0')),
    debt_impact NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Balance Neto entre los dos usuarios
CREATE TABLE balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id UUID NOT NULL REFERENCES users(id),
    user_b_id UUID NOT NULL REFERENCES users(id),
    net_balance NUMERIC(12, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_pair UNIQUE (user_a_id, user_b_id)
);
```

## 2. Tipos de TypeScript (src/types/database.ts)
```TypeScript
export type ClassificationType = '50' | '100' | '-100' | '0';
export type SourceType = 'audio' | 'image' | 'text';
export type QueueStatus = 'PENDING' | 'PROCESSED' | 'DISCARDED';

export interface User {
  id: string;
  telegram_id: number;
  name: string;
  created_at: string;
}

export interface AgykeItem {
  id: string;
  user_id: string;
  amount: number;
  concept: string | null;
  file_path?: string | null;
  source_type: SourceType;
  status: QueueStatus;
  telegram_message_id?: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  concept: string | null;
  classification: ClassificationType;
  debt_impact: number;
  created_at: string;
}

export interface GeminiExtractionResult {
  amount: number;
  concept: string;
}
```

## 3. Integración Gemini 1.5 Flash (src/services/gemini.ts)

El servicio debe usar el SDK oficial de Google Generative AI e implementar el siguiente prompt estructurado:
```TypeScript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiExtractionResult } from '../types/database';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `
Eres un asistente contable. Tu única tarea es analizar el audio, imagen o texto provisto y extraer el monto de la compra y un concepto corto.
Debes responder ÚNICAMENTE un objeto JSON válido con este formato:
{
  "amount": number,
  "concept": string
}
No agregues texto explicativo, solo el JSON. Si no encuentras un concepto claro, pon "Gasto general". Si no encuentras monto, pon 0.
`;

export async function processMediaWithGemini(
  fileBuffer: Buffer,
  mimeType: string
): Promise<GeminiExtractionResult> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const imageParts = [
    {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType
      },
    },
  ];

  const result = await model.generateContent([SYSTEM_PROMPT, ...imageParts]);
  const responseText = result.response.text();
  return JSON.parse(responseText) as GeminiExtractionResult;
}
```

