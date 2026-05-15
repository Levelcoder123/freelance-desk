// src/services/stripeService.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

/**
 * Creates a Stripe Payment Link for an invoice.
 * @param {object} invoice - Full invoice row from DB (with client_name, client_email, etc.)
 * @returns {string} Stripe payment link URL
 */
export async function createPaymentLink(invoice) {
    // Create a one-time Price object on the fly
    const price = await stripe.prices.create({
        currency: (invoice.currency || 'USD').toLowerCase(),
        unit_amount: Math.round(parseFloat(invoice.total_amount) * 100), // cents
        product_data: {
            name: `Invoice ${invoice.invoice_number}`,
            metadata: { invoice_id: invoice.id },
        },
    });

    const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        metadata: {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            user_id: invoice.user_id,
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
 * @param {Buffer} rawBody
 * @param {string} sig - value of `stripe-signature` header
 * @returns {Stripe.Event}
 */
export function constructWebhookEvent(rawBody, sig) {
    return stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
    );
}