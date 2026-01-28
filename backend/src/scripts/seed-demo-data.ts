/**
 * @file seed-demo-data.ts
 * @description Seed script to populate database with realistic demo data for 5 user personas.
 * 
 * Run with: npm run seed:demo
 * 
 * Creates 18-24 months of transaction history, loans, investments, goals, budgets, and recurrings.
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

// Import models
import User from '../models/user.model';
import Transaction from '../models/transaction.model';
import Loan from '../models/loan.model';
import Budget from '../models/budget.model';
import Goal from '../models/goal.model';
import RecurringSubscription from '../models/recurring.model';
import InvestmentHolding from '../models/investment.model';

// =============================================================================
// CONFIGURATION
// =============================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hackvengers';
const MONTHS_OF_HISTORY = 18; // 18 months of transaction history

// Demo user credentials (password: "demo123" for all)
const DEMO_PASSWORD = 'demo123';

// =============================================================================
// USER PERSONAS
// =============================================================================

interface PersonaConfig {
    email: string;
    name: string;
    monthlyIncome: number;
    incomeVariability: number; // 0 = fixed, 0.3 = 30% variation
    incomeCategory: string;
    expenseProfile: {
        rent: number;
        food: number;
        utilities: number;
        transport: number;
        entertainment: number;
        shopping: number;
        health: number;
        education: number;
    };
    loans: Array<{
        name: string;
        type: 'home' | 'car' | 'personal' | 'education' | 'credit_card' | 'other';
        principal: number;
        rate: number;
        tenure: number;
        lender: string;
    }>;
    investments: Array<{
        name: string;
        symbol: string;
        type: 'stock' | 'mutual_fund' | 'crypto' | 'gold' | 'fd' | 'other';
        quantity: number;
        avgPrice: number;
        currentPrice: number;
    }>;
    subscriptions: Array<{
        name: string;
        amount: number;
        category: string;
        frequency: 'monthly' | 'yearly' | 'weekly';
    }>;
    goals: Array<{
        title: string;
        target: number;
        current: number;
        deadline: Date;
        priority: number;
    }>;
    budgets: Record<string, number>;
    savingsRate: number; // % of income saved
}

const personas: PersonaConfig[] = [
    // 1. Student - ₹20K/month part-time
    {
        email: 'student@demo.com',
        name: 'Priya Sharma (Student)',
        monthlyIncome: 20000,
        incomeVariability: 0.1,
        incomeCategory: 'Part-time Job',
        expenseProfile: {
            rent: 5000,
            food: 4000,
            utilities: 1000,
            transport: 1500,
            entertainment: 1500,
            shopping: 1000,
            health: 500,
            education: 2000,
        },
        loans: [
            { name: 'Education Loan - SBI', type: 'education', principal: 400000, rate: 7.5, tenure: 60, lender: 'SBI' },
        ],
        investments: [
            { name: 'Axis Small Cap Fund', symbol: 'AXISSC', type: 'mutual_fund', quantity: 50, avgPrice: 85, currentPrice: 92 },
        ],
        subscriptions: [
            { name: 'Spotify', amount: 119, category: 'Entertainment', frequency: 'monthly' },
            { name: 'Netflix (shared)', amount: 199, category: 'Entertainment', frequency: 'monthly' },
        ],
        goals: [
            { title: 'Laptop Fund', target: 50000, current: 12000, deadline: new Date('2026-06-01'), priority: 1 },
            { title: 'Emergency Fund', target: 30000, current: 8000, deadline: new Date('2026-12-31'), priority: 2 },
        ],
        budgets: { 'Food & Dining': 4500, 'Entertainment': 2000, 'Shopping': 1500, 'Transport': 2000 },
        savingsRate: 0.10,
    },

    // 2. Salaried - ₹50K/month
    {
        email: 'salaried@demo.com',
        name: 'Rahul Verma (Salaried)',
        monthlyIncome: 50000,
        incomeVariability: 0,
        incomeCategory: 'Salary',
        expenseProfile: {
            rent: 12000,
            food: 8000,
            utilities: 3000,
            transport: 4000,
            entertainment: 3000,
            shopping: 4000,
            health: 2000,
            education: 0,
        },
        loans: [
            { name: 'Home Loan - HDFC', type: 'home', principal: 3000000, rate: 8.5, tenure: 240, lender: 'HDFC Bank' },
        ],
        investments: [
            { name: 'HDFC Top 100 Fund', symbol: 'HDFC100', type: 'mutual_fund', quantity: 200, avgPrice: 750, currentPrice: 820 },
            { name: 'Reliance Industries', symbol: 'RELIANCE', type: 'stock', quantity: 10, avgPrice: 2400, currentPrice: 2650 },
            { name: 'PPF Account', symbol: 'PPF', type: 'other', quantity: 1, avgPrice: 150000, currentPrice: 165000 },
        ],
        subscriptions: [
            { name: 'Netflix', amount: 649, category: 'Entertainment', frequency: 'monthly' },
            { name: 'Amazon Prime', amount: 1499, category: 'Shopping', frequency: 'yearly' },
            { name: 'Gym Membership', amount: 2000, category: 'Health & Fitness', frequency: 'monthly' },
            { name: 'Jio Fiber', amount: 999, category: 'Utilities', frequency: 'monthly' },
        ],
        goals: [
            { title: 'Emergency Fund', target: 300000, current: 180000, deadline: new Date('2026-06-01'), priority: 1 },
            { title: 'Vacation - Maldives', target: 200000, current: 45000, deadline: new Date('2026-12-01'), priority: 3 },
            { title: 'New Car Down Payment', target: 500000, current: 120000, deadline: new Date('2027-06-01'), priority: 2 },
        ],
        budgets: { 'Food & Dining': 10000, 'Entertainment': 4000, 'Shopping': 5000, 'Transport': 5000, 'Utilities': 4000 },
        savingsRate: 0.20,
    },

    // 3. Freelancer - ₹35K/month (variable)
    {
        email: 'freelancer@demo.com',
        name: 'Ankit Patel (Freelancer)',
        monthlyIncome: 35000,
        incomeVariability: 0.4, // 40% variation
        incomeCategory: 'Freelance',
        expenseProfile: {
            rent: 8000,
            food: 6000,
            utilities: 2000,
            transport: 2000,
            entertainment: 2500,
            shopping: 3000,
            health: 1500,
            education: 1000,
        },
        loans: [
            { name: 'Personal Loan - ICICI', type: 'personal', principal: 200000, rate: 12, tenure: 36, lender: 'ICICI Bank' },
        ],
        investments: [
            { name: 'SBI Blue Chip Fund', symbol: 'SBIBLU', type: 'mutual_fund', quantity: 100, avgPrice: 65, currentPrice: 72 },
        ],
        subscriptions: [
            { name: 'Adobe Creative Cloud', amount: 1675, category: 'Productivity', frequency: 'monthly' },
            { name: 'Figma Pro', amount: 950, category: 'Productivity', frequency: 'monthly' },
            { name: 'Disney+ Hotstar', amount: 299, category: 'Entertainment', frequency: 'monthly' },
        ],
        goals: [
            { title: 'Emergency Fund', target: 100000, current: 25000, deadline: new Date('2026-08-01'), priority: 1 },
            { title: 'New MacBook', target: 180000, current: 30000, deadline: new Date('2026-06-01'), priority: 2 },
        ],
        budgets: { 'Food & Dining': 7000, 'Entertainment': 3000, 'Shopping': 4000, 'Productivity': 3000 },
        savingsRate: 0.08,
    },

    // 4. Senior Professional - ₹1L/month
    {
        email: 'senior@demo.com',
        name: 'Vikram Mehta (Senior Pro)',
        monthlyIncome: 100000,
        incomeVariability: 0.05,
        incomeCategory: 'Salary',
        expenseProfile: {
            rent: 25000,
            food: 15000,
            utilities: 5000,
            transport: 8000,
            entertainment: 8000,
            shopping: 10000,
            health: 5000,
            education: 5000,
        },
        loans: [
            { name: 'Car Loan - Axis', type: 'car', principal: 800000, rate: 9, tenure: 60, lender: 'Axis Bank' },
        ],
        investments: [
            { name: 'Mirae Asset Large Cap', symbol: 'MALC', type: 'mutual_fund', quantity: 500, avgPrice: 95, currentPrice: 108 },
            { name: 'ICICI Prudential Tech Fund', symbol: 'IPTECH', type: 'mutual_fund', quantity: 300, avgPrice: 145, currentPrice: 162 },
            { name: 'TCS', symbol: 'TCS', type: 'stock', quantity: 25, avgPrice: 3200, currentPrice: 3650 },
            { name: 'Infosys', symbol: 'INFY', type: 'stock', quantity: 30, avgPrice: 1450, currentPrice: 1580 },
            { name: 'Gold ETF', symbol: 'GOLDBEES', type: 'gold', quantity: 50, avgPrice: 48, currentPrice: 54 },
        ],
        subscriptions: [
            { name: 'Netflix', amount: 649, category: 'Entertainment', frequency: 'monthly' },
            { name: 'Amazon Prime', amount: 1499, category: 'Shopping', frequency: 'yearly' },
            { name: 'Gym + Personal Trainer', amount: 5000, category: 'Health & Fitness', frequency: 'monthly' },
            { name: 'LinkedIn Premium', amount: 1500, category: 'Productivity', frequency: 'monthly' },
            { name: 'The Economist', amount: 8000, category: 'Education', frequency: 'yearly' },
        ],
        goals: [
            { title: 'Emergency Fund', target: 600000, current: 480000, deadline: new Date('2026-06-01'), priority: 1 },
            { title: 'Retirement Fund', target: 10000000, current: 2500000, deadline: new Date('2040-01-01'), priority: 2 },
            { title: "Child's Education Fund", target: 2000000, current: 450000, deadline: new Date('2035-01-01'), priority: 3 },
            { title: 'Europe Trip', target: 500000, current: 150000, deadline: new Date('2026-05-01'), priority: 4 },
        ],
        budgets: { 'Food & Dining': 18000, 'Entertainment': 10000, 'Shopping': 12000, 'Transport': 10000, 'Health & Fitness': 6000 },
        savingsRate: 0.25,
    },

    // 5. Retiree - ₹40K/month (pension)
    {
        email: 'retiree@demo.com',
        name: 'Sunita Devi (Retiree)',
        monthlyIncome: 40000,
        incomeVariability: 0,
        incomeCategory: 'Pension',
        expenseProfile: {
            rent: 0, // Owns home
            food: 8000,
            utilities: 4000,
            transport: 2000,
            entertainment: 3000,
            shopping: 4000,
            health: 8000,
            education: 0,
        },
        loans: [], // No loans
        investments: [
            { name: 'SBI Magnum Gilt Fund', symbol: 'SBIGILT', type: 'mutual_fund', quantity: 1000, avgPrice: 52, currentPrice: 55 },
            { name: 'Fixed Deposit - SBI', symbol: 'FD-SBI', type: 'fd', quantity: 1, avgPrice: 500000, currentPrice: 538000 },
            { name: 'Senior Citizen Savings Scheme', symbol: 'SCSS', type: 'other', quantity: 1, avgPrice: 1500000, currentPrice: 1620000 },
        ],
        subscriptions: [
            { name: 'Tata Sky', amount: 400, category: 'Entertainment', frequency: 'monthly' },
            { name: 'Newspaper - TOI', amount: 350, category: 'Education', frequency: 'monthly' },
        ],
        goals: [
            { title: 'Emergency Fund', target: 200000, current: 180000, deadline: new Date('2026-06-01'), priority: 1 },
            { title: 'Medical Emergency Fund', target: 500000, current: 350000, deadline: new Date('2026-12-31'), priority: 2 },
            { title: "Grandchild's Birthday Gift", target: 50000, current: 40000, deadline: new Date('2026-03-01'), priority: 3 },
        ],
        budgets: { 'Food & Dining': 10000, 'Health & Fitness': 10000, 'Utilities': 5000, 'Entertainment': 4000 },
        savingsRate: 0.15,
    },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function randomVariation(base: number, variability: number): number {
    const variation = base * variability;
    return Math.round(base + (Math.random() * variation * 2 - variation));
}

function randomDate(startDate: Date, endDate: Date): Date {
    const start = startDate.getTime();
    const end = endDate.getTime();
    return new Date(start + Math.random() * (end - start));
}

function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    if (annualRate === 0) return principal / tenureMonths;
    const monthlyRate = annualRate / 12 / 100;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi);
}

const expenseCategories: Record<string, string> = {
    rent: 'Rent',
    food: 'Food & Dining',
    utilities: 'Utilities',
    transport: 'Transport',
    entertainment: 'Entertainment',
    shopping: 'Shopping',
    health: 'Health & Fitness',
    education: 'Education',
};

const expenseMerchants: Record<string, string[]> = {
    rent: ['Landlord', 'Housing Society'],
    food: ['Swiggy', 'Zomato', 'BigBasket', 'DMart', 'Local Restaurant', 'Cafe Coffee Day', 'McDonald\'s'],
    utilities: ['Electricity Board', 'Water Supply', 'Gas Agency', 'Jio', 'Airtel'],
    transport: ['Uber', 'Ola', 'Petrol Pump', 'Metro Card', 'Indian Railways'],
    entertainment: ['Netflix', 'PVR Cinemas', 'BookMyShow', 'Spotify', 'Gaming'],
    shopping: ['Amazon', 'Flipkart', 'Myntra', 'Reliance Digital', 'Croma'],
    health: ['Apollo Pharmacy', 'Gym', 'Doctor Consultation', 'Lab Tests', 'MedPlus'],
    education: ['Udemy', 'Coursera', 'Books Store', 'Stationery', 'Coaching'],
};

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function seedUser(persona: PersonaConfig): Promise<mongoose.Types.ObjectId> {
    console.log(`  Creating user: ${persona.name}`);

    // Check if user already exists
    const existing = await User.findOne({ email: persona.email });
    if (existing) {
        console.log(`    User already exists, deleting old data...`);
        await Promise.all([
            Transaction.deleteMany({ userId: existing._id }),
            Loan.deleteMany({ userId: existing._id }),
            Budget.deleteMany({ userId: existing._id }),
            Goal.deleteMany({ userId: existing._id }),
            RecurringSubscription.deleteMany({ userId: existing._id }),
            InvestmentHolding.deleteMany({ userId: existing._id }),
        ]);
        await User.deleteOne({ _id: existing._id });
    }

    const user = await User.create({
        email: persona.email,
        name: persona.name,
        password: DEMO_PASSWORD,
    });

    return user._id as mongoose.Types.ObjectId;
}

async function seedTransactions(userId: mongoose.Types.ObjectId, persona: PersonaConfig): Promise<void> {
    console.log(`    Generating ${MONTHS_OF_HISTORY} months of transactions...`);

    const transactions: any[] = [];
    const now = new Date();

    for (let monthOffset = 0; monthOffset < MONTHS_OF_HISTORY; monthOffset++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);

        // Income transaction (on 1st or 28th)
        const incomeAmount = randomVariation(persona.monthlyIncome, persona.incomeVariability);
        transactions.push({
            userId,
            amount: incomeAmount,
            type: 'income',
            category: persona.incomeCategory,
            description: `${persona.incomeCategory} for ${monthDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`,
            merchant: persona.incomeCategory === 'Salary' ? 'Employer' : 'Various Clients',
            date: new Date(monthDate.getFullYear(), monthDate.getMonth(), persona.incomeCategory === 'Salary' ? 28 : 15),
        });

        // Expense transactions
        for (const [key, baseAmount] of Object.entries(persona.expenseProfile)) {
            if (baseAmount === 0) continue;

            const category = expenseCategories[key];
            const merchants = expenseMerchants[key] || ['General'];

            // Split into multiple transactions for realism
            const numTransactions = key === 'rent' ? 1 : Math.floor(Math.random() * 4) + 2;
            const totalAmount = randomVariation(baseAmount, 0.15);

            for (let i = 0; i < numTransactions; i++) {
                const txnAmount = i === numTransactions - 1
                    ? Math.round(totalAmount / numTransactions)
                    : Math.round(totalAmount / numTransactions * (0.8 + Math.random() * 0.4));

                transactions.push({
                    userId,
                    amount: Math.max(50, txnAmount),
                    type: 'expense',
                    category,
                    description: `${category} expense`,
                    merchant: merchants[Math.floor(Math.random() * merchants.length)],
                    date: randomDate(
                        new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
                        new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
                    ),
                });
            }
        }

        // Savings transaction (if applicable)
        if (persona.savingsRate > 0) {
            const savingsAmount = Math.round(incomeAmount * persona.savingsRate);
            transactions.push({
                userId,
                amount: savingsAmount,
                type: 'expense', // Transfer to savings
                category: 'Savings',
                description: 'Monthly savings transfer',
                merchant: 'Bank Transfer',
                date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5),
            });
        }
    }

    await Transaction.insertMany(transactions);
    console.log(`      Created ${transactions.length} transactions`);
}

async function seedLoans(userId: mongoose.Types.ObjectId, persona: PersonaConfig): Promise<void> {
    if (persona.loans.length === 0) {
        console.log(`    No loans for this user`);
        return;
    }

    console.log(`    Creating ${persona.loans.length} loan(s)...`);

    for (const loan of persona.loans) {
        const emi = calculateEMI(loan.principal, loan.rate, loan.tenure);
        const monthsPaid = Math.floor(Math.random() * 12) + 6; // 6-18 months paid
        const outstanding = Math.max(0, loan.principal - (emi * monthsPaid * 0.3)); // Rough estimate

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - monthsPaid);

        const nextPaymentDate = new Date();
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        nextPaymentDate.setDate(5);

        await Loan.create({
            userId,
            name: loan.name,
            loanType: loan.type,
            principalAmount: loan.principal,
            outstandingAmount: outstanding,
            interestRate: loan.rate,
            tenureMonths: loan.tenure,
            emiAmount: emi,
            startDate,
            nextPaymentDate,
            status: 'active',
            lender: loan.lender,
        });
    }
}

async function seedInvestments(userId: mongoose.Types.ObjectId, persona: PersonaConfig): Promise<void> {
    if (persona.investments.length === 0) {
        console.log(`    No investments for this user`);
        return;
    }

    console.log(`    Creating ${persona.investments.length} investment(s)...`);

    for (const inv of persona.investments) {
        await InvestmentHolding.create({
            userId,
            name: inv.name,
            symbol: inv.symbol,
            type: inv.type,
            quantity: inv.quantity,
            averagePrice: inv.avgPrice,
            currentPrice: inv.currentPrice,
            lastUpdated: new Date(),
        });
    }
}

async function seedSubscriptions(userId: mongoose.Types.ObjectId, persona: PersonaConfig): Promise<void> {
    if (persona.subscriptions.length === 0) {
        console.log(`    No subscriptions for this user`);
        return;
    }

    console.log(`    Creating ${persona.subscriptions.length} subscription(s)...`);

    for (const sub of persona.subscriptions) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12));

        const nextBillingDate = new Date();
        nextBillingDate.setDate(nextBillingDate.getDate() + Math.floor(Math.random() * 30));

        await RecurringSubscription.create({
            userId,
            name: sub.name,
            amount: sub.amount,
            category: sub.category,
            frequency: sub.frequency,
            startDate,
            nextBillingDate,
            status: 'active',
        });
    }
}

async function seedGoals(userId: mongoose.Types.ObjectId, persona: PersonaConfig): Promise<void> {
    if (persona.goals.length === 0) {
        console.log(`    No goals for this user`);
        return;
    }

    console.log(`    Creating ${persona.goals.length} goal(s)...`);

    for (const goal of persona.goals) {
        await Goal.create({
            userId,
            title: goal.title,
            targetAmount: goal.target,
            currentAmount: goal.current,
            deadline: goal.deadline,
            status: 'active',
            priority: goal.priority,
        });
    }
}

async function seedBudgets(userId: mongoose.Types.ObjectId, persona: PersonaConfig): Promise<void> {
    const categories = Object.keys(persona.budgets);
    if (categories.length === 0) {
        console.log(`    No budgets for this user`);
        return;
    }

    console.log(`    Creating budgets for current month...`);

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    for (const [category, limit] of Object.entries(persona.budgets)) {
        await Budget.create({
            userId,
            category,
            limit,
            month,
            year,
        });
    }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
    console.log('🌱 Starting Demo Data Seeder...\n');
    console.log(`📅 Generating ${MONTHS_OF_HISTORY} months of history for ${personas.length} personas\n`);

    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Seed each persona
        for (const persona of personas) {
            console.log(`\n👤 Seeding: ${persona.name}`);
            console.log('─'.repeat(50));

            const userId = await seedUser(persona);
            await seedTransactions(userId, persona);
            await seedLoans(userId, persona);
            await seedInvestments(userId, persona);
            await seedSubscriptions(userId, persona);
            await seedGoals(userId, persona);
            await seedBudgets(userId, persona);

            console.log(`✅ Completed: ${persona.name}\n`);
        }

        console.log('\n' + '═'.repeat(50));
        console.log('🎉 Demo data seeding completed successfully!');
        console.log('═'.repeat(50));
        console.log('\n📝 Demo Accounts:');
        console.log('─'.repeat(50));
        for (const persona of personas) {
            console.log(`   Email: ${persona.email}`);
            console.log(`   Password: ${DEMO_PASSWORD}`);
            console.log(`   Income: ₹${persona.monthlyIncome.toLocaleString('en-IN')}/month`);
            console.log('');
        }

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

main();
