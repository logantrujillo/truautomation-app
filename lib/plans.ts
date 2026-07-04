import type { PlanId } from './types';

export const SETUP_FEE = 679;

export const PLANS: Record<PlanId, {
  label: string;
  perMinute: number;
  description: string;
  meteredPriceEnvVar: 'STRIPE_PRICE_AFTER_HOURS_METERED' | 'STRIPE_PRICE_247_METERED';
  setupFeePriceEnvVar: 'STRIPE_PRICE_SETUP_FEE_AFTER_HOURS' | 'STRIPE_PRICE_SETUP_FEE_247';
}> = {
  after_hours: {
    label: 'After Hours',
    perMinute: 0.42,
    description: 'Alex answers calls outside your business hours.',
    meteredPriceEnvVar: 'STRIPE_PRICE_AFTER_HOURS_METERED',
    setupFeePriceEnvVar: 'STRIPE_PRICE_SETUP_FEE_AFTER_HOURS',
  },
  '247': {
    label: '24/7',
    perMinute: 0.47,
    description: 'Alex answers every call, day or night.',
    meteredPriceEnvVar: 'STRIPE_PRICE_247_METERED',
    setupFeePriceEnvVar: 'STRIPE_PRICE_SETUP_FEE_247',
  },
};
