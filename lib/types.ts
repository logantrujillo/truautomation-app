export type ClientStatus = 'pending_onboarding' | 'pending_payment' | 'active' | 'suspended';
export type PlanId = 'after_hours' | '247';
export type CallOutcome = 'booked' | 'cancelled' | 'escalated' | 'inquiry';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface BusinessHours {
  [day: string]: { open: string; close: string; closed: boolean };
}

export interface Client {
  id: string;
  email: string;
  business_name: string | null;
  contact_name: string | null;
  phone: string | null;
  industry: string | null;
  address: string | null;
  plan: PlanId | null;
  status: ClientStatus;
  alex_instructions: string | null;
  business_hours: BusinessHours | null;
  twilio_number: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_setup_item_id: string | null;
  stripe_metered_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Faq {
  id: string;
  client_id: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface Call {
  id: string;
  client_id: string;
  vapi_call_id: string | null;
  twilio_number: string | null;
  caller_number: string | null;
  caller_name: string | null;
  started_at: string | null;
  duration_seconds: number;
  outcome: CallOutcome | null;
  summary: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  call_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  scheduled_at: string | null;
  service: string | null;
  notes: string | null;
  status: AppointmentStatus;
  google_event_id: string | null;
  created_at: string;
}

export interface TwilioNumber {
  phone_number: string;
  friendly_name: string | null;
  assigned_client_id: string | null;
  created_at: string;
}
