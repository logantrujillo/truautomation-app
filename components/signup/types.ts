import type { BusinessHours, PlanId } from '@/lib/types';

export interface ServiceDraft {
  name: string;
  description: string;
}

export interface FaqDraft {
  question: string;
  answer: string;
}

export const DEFAULT_HOURS: BusinessHours = {
  Mon: { open: '08:00', close: '17:00', closed: false },
  Tue: { open: '08:00', close: '17:00', closed: false },
  Wed: { open: '08:00', close: '17:00', closed: false },
  Thu: { open: '08:00', close: '17:00', closed: false },
  Fri: { open: '08:00', close: '17:00', closed: false },
  Sat: { open: '09:00', close: '13:00', closed: true },
  Sun: { open: '09:00', close: '13:00', closed: true },
};

export interface WizardState {
  // Step 1
  email: string;
  contactName: string;
  // Step 2
  businessName: string;
  phone: string;
  industry: string;
  address: string;
  // Step 3
  plan: PlanId | '';
  // Step 4
  services: ServiceDraft[];
  businessHours: BusinessHours;
  // Step 5
  alexInstructions: string;
  faqs: FaqDraft[];
  // Step 6
  googleConnected: boolean;
}

export const DEFAULT_WIZARD_STATE: WizardState = {
  email: '',
  contactName: '',
  businessName: '',
  phone: '',
  industry: '',
  address: '',
  plan: '',
  services: [{ name: '', description: '' }],
  businessHours: DEFAULT_HOURS,
  alexInstructions: '',
  faqs: [{ question: '', answer: '' }],
  googleConnected: false,
};
