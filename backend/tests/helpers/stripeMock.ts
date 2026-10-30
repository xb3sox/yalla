/**
 * In-memory Stripe test double. DB suites must never call the real Stripe
 * API (no network/secrets in CI). Register per test file with:
 *
 *   jest.mock('stripe', () => require('../helpers/stripeMock').stripeMockFactory());
 *
 * (adjust the relative path to the test file's depth).
 */
export const stripeMockFactory = () => {
  let counter = 0;
  const intents = new Map<string, any>();

  // Regular function (not an arrow): the model calls `new Stripe(...)`.
  const MockStripe = jest.fn().mockImplementation(function (this: any) {
    this.paymentIntents = {
      create: async (params: any) => {
        const id = `pi_test_${++counter}`;
        const intent = {
          id,
          client_secret: `${id}_secret`,
          status: 'requires_payment_method',
          amount: params.amount,
          currency: params.currency,
          latest_charge: `ch_test_${counter}`,
        };
        intents.set(id, intent);
        return intent;
      },
      retrieve: async (id: string) => {
        const intent = intents.get(id);
        if (!intent) {
          throw new Error(`No such payment_intent: '${id}'`);
        }
        return { ...intent, status: 'succeeded' };
      },
    };
    this.charges = {
      retrieve: async (id: string) => ({
        id,
        receipt_url: 'https://example.test/receipt',
      }),
    };
    this.refunds = {
      create: async (params: any) => ({
        id: `re_test_${++counter}`,
        status: 'succeeded',
        amount: params.amount,
        payment_intent: params.payment_intent,
      }),
    };
    this.webhooks = {
      constructEvent: () => {
        throw new Error('stripeMock: constructEvent is not implemented');
      },
    };
  });

  return { __esModule: true, default: MockStripe };
};
