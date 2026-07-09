import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendClientUpdateNotification } from '@/lib/email';
import type { BusinessHours, Client } from '@/lib/types';

interface ServiceRow {
  name: string;
  description: string;
}
interface FaqRow {
  question: string;
  answer: string;
}

const FIELD_LABELS: Record<string, string> = {
  business_name: 'Business Name',
  phone: 'Phone',
  industry: 'Industry',
  address: 'Address',
  alex_instructions: 'Alex Instructions',
  business_hours: 'Business Hours',
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const {
    businessName,
    phone,
    industry,
    address,
    alexInstructions,
    businessHours,
    services,
    faqs,
  }: {
    businessName: string;
    phone: string;
    industry: string;
    address: string;
    alexInstructions: string;
    businessHours: BusinessHours;
    services: ServiceRow[];
    faqs: FaqRow[];
  } = body;

  const { data: before } = await supabase.from('clients').select('*').eq('id', user.id).single();
  const { data: beforeServices } = await supabase.from('services').select('name, description').eq('client_id', user.id);
  const { data: beforeFaqs } = await supabase.from('faqs').select('question, answer').eq('client_id', user.id);

  const nextValues: Record<string, unknown> = {
    business_name: businessName,
    phone,
    industry,
    address,
    alex_instructions: alexInstructions,
    business_hours: businessHours,
  };

  const changes: { field: string; oldValue: string; newValue: string }[] = [];
  if (before) {
    for (const [dbField, label] of Object.entries(FIELD_LABELS)) {
      const oldValue = displayValue((before as Record<string, unknown>)[dbField]);
      const newValue = displayValue(nextValues[dbField]);
      if (oldValue !== newValue) {
        changes.push({ field: label, oldValue, newValue });
      }
    }
  }

  const { error: clientUpdateError } = await supabase.from('clients').update(nextValues).eq('id', user.id);
  if (clientUpdateError) {
    return NextResponse.json({ error: clientUpdateError.message }, { status: 500 });
  }

  const validServices = (services ?? []).filter((s) => s.name?.trim());
  await supabase.from('services').delete().eq('client_id', user.id);
  if (validServices.length > 0) {
    await supabase.from('services').insert(validServices.map((s) => ({ client_id: user.id, name: s.name, description: s.description })));
  }

  const validFaqs = (faqs ?? []).filter((f) => f.question?.trim() && f.answer?.trim());
  await supabase.from('faqs').delete().eq('client_id', user.id);
  if (validFaqs.length > 0) {
    await supabase.from('faqs').insert(validFaqs.map((f) => ({ client_id: user.id, question: f.question, answer: f.answer })));
  }

  const normalize = (arr: unknown[]) => JSON.stringify(arr);
  if (normalize(beforeServices ?? []) !== normalize(validServices)) {
    changes.push({ field: 'Services', oldValue: displayValue(beforeServices ?? []), newValue: displayValue(validServices) });
  }
  if (normalize(beforeFaqs ?? []) !== normalize(validFaqs)) {
    changes.push({ field: 'FAQs', oldValue: displayValue(beforeFaqs ?? []), newValue: displayValue(validFaqs) });
  }

  if (before && changes.length > 0) {
    try {
      await sendClientUpdateNotification(before as Client, changes);
    } catch {
      // Notification failure shouldn't block the client's save from succeeding.
    }
  }

  return NextResponse.json({ success: true });
}
