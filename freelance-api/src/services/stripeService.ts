// src/services/stripeService.ts
import Stripe from 'stripe';
import { Invoice } from '../types/index.js';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || 'sk_test_123', {
    apiVersion: '2023-10-16' as any,
});

/**
 * Creates a Stripe Payment Link for an invoice.
 * @param {Invoice} invoice - Full invoice row from DB (with client_name, client_email, etc.)
 * @returns {Promise<string>} Stripe payment link URL
 */
export async function createPaymentLink(invoice: Invoice): Promise<string> {
    // Create a one-time Price object on the fly
    const price = await stripe.prices.create({
        currency: (invoice.currency || 'USD').toLowerCase(),
        unit_amount: Math.round(parseFloat(invoice.totalAmount) * 100), // cents
        product_data: {
            name: `Invoice ${invoice.invoiceNumber}`,
            metadata: { invoice_id: invoice.id },
        },
    });

    const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        metadata: {
            invoice_id: invoice.id,
            invoice_number: invoice.invoiceNumber,
            user_id: invoice.userId,
        },
        after_completion: {
            type: 'redirect',
            redirect: { url: `${process.env.FRONTEND_URL}/invoices/${invoice.id}?paid=1` },
        },
    });

    return paymentLink.url;
}

/**
 * Validates and constructs a Stripe webhook event.
 * Call this in POST /webhooks/stripe with the raw body buffer.
 */
export function constructWebhookEvent(rawBody: Buffer, sig: string): Stripe.Event {
    return stripe.webhooks.constructEvent(
        rawBody,
        sig,
        (process.env.STRIPE_WEBHOOK_SECRET as string) || 'whsec_123'
    );
}
