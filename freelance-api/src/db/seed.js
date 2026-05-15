// src/db/seed.js
// Run with: make seed
// Inserts realistic dummy data for one demo user across all tables.

import bcrypt from 'bcryptjs';
import { query, pool } from '../config/database.js';

// ─── Config ──────────────────────────────────────────────────────────────────

const DEMO_EMAIL = 'demo@freelancedesk.com';
const DEMO_PASSWORD = 'password123';
const DEMO_NAME = 'Muaz Khan';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
}

function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
    console.log('🌱 Seeding database…\n');

    // ── 1. User ────────────────────────────────────────────────────────────────
    console.log('→ Creating demo user…');
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    const { rows: [user] } = await query(`
    INSERT INTO users (email, password_hash, full_name, plan, monthly_goal, tax_rate, se_tax_rate)
    VALUES ($1, $2, $3, 'pro', 8000, 25.0, 15.3)
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          full_name     = EXCLUDED.full_name
    RETURNING id
  `, [DEMO_EMAIL, passwordHash, DEMO_NAME]);

    const userId = user.id;
    console.log(`  ✓ User: ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n`);

    // ── 2. Clients ─────────────────────────────────────────────────────────────
    console.log('→ Creating clients…');
    const clientData = [
        { name: 'Sarah Mitchell', company: 'Bright Digital', email: 'sarah@brightdigital.com', phone: '+1 415 234 5678', status: 'active', hourly_rate: 95 },
        { name: 'James Thornton', company: 'Thornton & Co', email: 'james@thorntonco.com', phone: '+1 312 876 5432', status: 'active', hourly_rate: 120 },
        { name: 'Priya Kapoor', company: 'Kapoor Ventures', email: 'priya@kapoorventures.io', phone: '+1 646 345 6789', status: 'active', hourly_rate: 85 },
        { name: 'Luca Bianchi', company: 'Studio Bianchi', email: 'luca@studiobianchi.it', phone: '+39 02 1234567', status: 'active', hourly_rate: 75 },
        { name: 'Emma Hartwell', company: 'Hartwell Creative', email: 'emma@hartwellcreative.com', phone: '+44 20 7946 0123', status: 'inactive', hourly_rate: 110 },
    ];

    const clients = [];
    for (const c of clientData) {
        const { rows: [client] } = await query(`
      INSERT INTO clients (user_id, name, company, email, phone, status, hourly_rate, tags)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id, name
    `, [userId, c.name, c.company, c.email, c.phone, c.status, c.hourly_rate, ['design', 'web']]);
        clients.push(client);
        console.log(`  ✓ ${client.name}`);
    }
    console.log();

    // ── 3. Projects ────────────────────────────────────────────────────────────
    console.log('→ Creating projects…');
    const projectData = [
        { name: 'Brand Identity Redesign', client: 0, status: 'active', priority: 'high', progress: 65, budget: 4500, deadline: daysFromNow(14) },
        { name: 'E-commerce Platform', client: 1, status: 'active', priority: 'high', progress: 40, budget: 12000, deadline: daysFromNow(30) },
        { name: 'Mobile App UI/UX', client: 2, status: 'active', priority: 'medium', progress: 80, budget: 6000, deadline: daysFromNow(7) },
        { name: 'Marketing Site Revamp', client: 3, status: 'paused', priority: 'medium', progress: 25, budget: 3200, deadline: daysFromNow(45) },
        { name: 'Dashboard Analytics Tool', client: 0, status: 'completed', priority: 'low', progress: 100, budget: 5500, deadline: daysAgo(10) },
        { name: 'Logo & Style Guide', client: 4, status: 'completed', priority: 'low', progress: 100, budget: 1800, deadline: daysAgo(30) },
    ];

    const projects = [];
    for (const p of projectData) {
        const { rows: [project] } = await query(`
      INSERT INTO projects (user_id, client_id, name, status, priority, progress, budget, deadline)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id, name
    `, [userId, clients[p.client].id, p.name, p.status, p.priority, p.progress, p.budget, p.deadline]);
        projects.push(project);
        console.log(`  ✓ ${project.name}`);
    }
    console.log();

    // ── 4. Invoices ────────────────────────────────────────────────────────────
    console.log('→ Creating invoices…');
    const invoiceData = [
        {
            client: 0, project: 0, number: 'INV-2026-001', status: 'paid',
            amount: 2250, issue_date: daysAgo(60), due_date: daysAgo(30),
            paid_at: daysAgo(28),
            items: [
                { description: 'Brand strategy & research', quantity: 1, rate: 1500, amount: 1500 },
                { description: 'Initial concepts (3 rounds)', quantity: 5, rate: 150, amount: 750 },
            ],
        },
        {
            client: 1, project: 1, number: 'INV-2026-002', status: 'paid',
            amount: 4800, issue_date: daysAgo(45), due_date: daysAgo(15),
            paid_at: daysAgo(14),
            items: [
                { description: 'Discovery & architecture', quantity: 8, rate: 120, amount: 960 },
                { description: 'Frontend development', quantity: 32, rate: 120, amount: 3840 },
            ],
        },
        {
            client: 2, project: 2, number: 'INV-2026-003', status: 'pending',
            amount: 3200, issue_date: daysAgo(10), due_date: daysFromNow(20),
            paid_at: null,
            items: [
                { description: 'Wireframes & user flows', quantity: 1, rate: 1200, amount: 1200 },
                { description: 'High-fidelity UI screens', quantity: 16, rate: 125, amount: 2000 },
            ],
        },
        {
            client: 3, project: 3, number: 'INV-2026-004', status: 'pending',
            amount: 1600, issue_date: daysAgo(5), due_date: daysFromNow(25),
            paid_at: null,
            items: [
                { description: 'Content audit & sitemap', quantity: 1, rate: 600, amount: 600 },
                { description: 'Design mockups', quantity: 8, rate: 125, amount: 1000 },
            ],
        },
        {
            client: 0, project: 4, number: 'INV-2026-005', status: 'paid',
            amount: 5500, issue_date: daysAgo(20), due_date: daysAgo(5),
            paid_at: daysAgo(4),
            items: [
                { description: 'Analytics dashboard design', quantity: 1, rate: 3000, amount: 3000 },
                { description: 'Component library', quantity: 20, rate: 125, amount: 2500 },
            ],
        },
        {
            client: 4, project: 5, number: 'INV-2026-006', status: 'overdue',
            amount: 1800, issue_date: daysAgo(40), due_date: daysAgo(10),
            paid_at: null,
            items: [
                { description: 'Logo design (3 concepts)', quantity: 1, rate: 900, amount: 900 },
                { description: 'Brand style guide', quantity: 1, rate: 900, amount: 900 },
            ],
        },
        {
            client: 1, project: 1, number: 'INV-2026-007', status: 'draft',
            amount: 3600, issue_date: daysAgo(1), due_date: daysFromNow(30),
            paid_at: null,
            items: [
                { description: 'Backend API development', quantity: 30, rate: 120, amount: 3600 },
            ],
        },
    ];

    for (const inv of invoiceData) {
        await query(`
      INSERT INTO invoices
        (user_id, client_id, project_id, invoice_number, status, amount,
         currency, tax_rate, issue_date, due_date, paid_at, notes, line_items)
      VALUES ($1,$2,$3,$4,$5,$6,'USD',0,$7,$8,$9,$10,$11)
    `, [
            userId,
            clients[inv.client].id,
            projects[inv.project].id,
            inv.number,
            inv.status,
            inv.amount,
            inv.issue_date,
            inv.due_date,
            inv.paid_at,
            'Payment due within 30 days. Thank you for your business.',
            JSON.stringify(inv.items),
        ]);
        console.log(`  ✓ ${inv.number} — ${inv.status} — $${inv.amount}`);
    }
    console.log();

    // ── 5. Expenses ────────────────────────────────────────────────────────────
    console.log('→ Creating expenses…');
    const expenseData = [
        { description: 'Adobe Creative Cloud', amount: 54.99, category: 'Software', date: daysAgo(5) },
        { description: 'Figma Pro subscription', amount: 15.00, category: 'Software', date: daysAgo(5) },
        { description: 'MacBook Pro M3', amount: 2499.00, category: 'Hardware', date: daysAgo(90) },
        { description: 'External SSD 2TB', amount: 89.99, category: 'Hardware', date: daysAgo(60) },
        { description: 'Flight to client meeting', amount: 320.00, category: 'Travel', date: daysAgo(20) },
        { description: 'Hotel — 2 nights', amount: 240.00, category: 'Travel', date: daysAgo(19) },
        { description: 'Google Ads campaign', amount: 200.00, category: 'Marketing', date: daysAgo(15) },
        { description: 'LinkedIn Premium', amount: 39.99, category: 'Marketing', date: daysAgo(5) },
        { description: 'Office desk & chair', amount: 650.00, category: 'Office', date: daysAgo(45) },
        { description: 'Notion Pro', amount: 16.00, category: 'Software', date: daysAgo(5) },
        { description: 'Udemy — React course', amount: 14.99, category: 'Education', date: daysAgo(30) },
        { description: 'Design books x3', amount: 87.00, category: 'Education', date: daysAgo(25) },
        { description: 'Internet bill — April', amount: 59.99, category: 'Office', date: daysAgo(10) },
        { description: 'Dribbble Pro', amount: 8.00, category: 'Marketing', date: daysAgo(5) },
        { description: 'AWS hosting', amount: 22.50, category: 'Software', date: daysAgo(2) },
    ];

    for (const e of expenseData) {
        await query(`
      INSERT INTO expenses (user_id, description, amount, currency, category, expense_date)
      VALUES ($1,$2,$3,'USD',$4,$5)
    `, [userId, e.description, e.amount, e.category, e.date]);
        console.log(`  ✓ ${e.description} — $${e.amount}`);
    }
    console.log();

    // ── Summary ────────────────────────────────────────────────────────────────
    console.log('✅ Seed complete!\n');
    console.log('─────────────────────────────────');
    console.log(`  Login:    ${DEMO_EMAIL}`);
    console.log(`  Password: ${DEMO_PASSWORD}`);
    console.log('─────────────────────────────────');
    console.log(`  Clients:  ${clients.length}`);
    console.log(`  Projects: ${projects.length}`);
    console.log(`  Invoices: ${invoiceData.length}`);
    console.log(`  Expenses: ${expenseData.length}`);
    console.log('─────────────────────────────────\n');

    await pool.end();
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
