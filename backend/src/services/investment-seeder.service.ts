/**
 * @file investment-seeder.service.ts
 * @description Seeds mock investment data for new users.
 * 
 * This service is called during user registration to populate
 * realistic investment data for demonstration and testing.
 */

import { Types } from 'mongoose';
import InvestmentHolding from '../models/investment.model';
import Transaction from '../models/transaction.model';

// =============================================================================
// MOCK DATA TEMPLATES
// =============================================================================

interface MockInvestment {
    name: string;
    symbol: string;
    type: 'stock' | 'mutual_fund' | 'ppf' | 'other';
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    amount: number;
    investmentMode: 'sip' | 'lumpsum' | 'stp';
    sipFrequency?: 'weekly' | 'monthly' | 'yearly';
    schemeType?: 'PPF' | 'NPS' | 'EPF' | 'ELSS';
    daysAgo: number; // Investment date offset from now
}

/**
 * Mock investments template - 4-5 per asset type
 */
const MOCK_INVESTMENTS: MockInvestment[] = [
    // =========================================================================
    // MUTUAL FUNDS (5 investments)
    // =========================================================================
    {
        name: 'HDFC Mid-Cap Opportunities Fund',
        symbol: 'HDFCMIDCAP',
        type: 'mutual_fund',
        quantity: 150,
        averagePrice: 180.50,
        currentPrice: 195.75,
        amount: 27075,
        investmentMode: 'sip',
        sipFrequency: 'monthly',
        daysAgo: 365,
    },
    {
        name: 'ICICI Prudential Bluechip Fund',
        symbol: 'ICICIBLUECHIP',
        type: 'mutual_fund',
        quantity: 200,
        averagePrice: 85.00,
        currentPrice: 92.50,
        amount: 17000,
        investmentMode: 'sip',
        sipFrequency: 'monthly',
        daysAgo: 180,
    },
    {
        name: 'SBI Small Cap Fund',
        symbol: 'SBISMALLCAP',
        type: 'mutual_fund',
        quantity: 100,
        averagePrice: 145.00,
        currentPrice: 168.25,
        amount: 14500,
        investmentMode: 'lumpsum',
        daysAgo: 90,
    },
    {
        name: 'Axis Long Term Equity Fund (ELSS)',
        symbol: 'AXISELSS',
        type: 'mutual_fund',
        quantity: 250,
        averagePrice: 72.00,
        currentPrice: 78.50,
        amount: 18000,
        investmentMode: 'sip',
        sipFrequency: 'monthly',
        schemeType: 'ELSS',
        daysAgo: 730,
    },
    {
        name: 'Nifty 50 Index Fund',
        symbol: 'NIFTY50',
        type: 'mutual_fund',
        quantity: 300,
        averagePrice: 175.00,
        currentPrice: 188.00,
        amount: 52500,
        investmentMode: 'stp',
        sipFrequency: 'monthly',
        daysAgo: 120,
    },

    // =========================================================================
    // STOCKS (5 investments)
    // =========================================================================
    {
        name: 'Reliance Industries Ltd',
        symbol: 'RELIANCE',
        type: 'stock',
        quantity: 15,
        averagePrice: 2450.00,
        currentPrice: 2680.00,
        amount: 36750,
        investmentMode: 'lumpsum',
        daysAgo: 200,
    },
    {
        name: 'Tata Consultancy Services',
        symbol: 'TCS',
        type: 'stock',
        quantity: 10,
        averagePrice: 3500.00,
        currentPrice: 3850.00,
        amount: 35000,
        investmentMode: 'lumpsum',
        daysAgo: 150,
    },
    {
        name: 'Infosys Ltd',
        symbol: 'INFY',
        type: 'stock',
        quantity: 25,
        averagePrice: 1420.00,
        currentPrice: 1580.00,
        amount: 35500,
        investmentMode: 'lumpsum',
        daysAgo: 300,
    },
    {
        name: 'HDFC Bank Ltd',
        symbol: 'HDFCBANK',
        type: 'stock',
        quantity: 20,
        averagePrice: 1620.00,
        currentPrice: 1750.00,
        amount: 32400,
        investmentMode: 'lumpsum',
        daysAgo: 180,
    },
    {
        name: 'ITC Ltd',
        symbol: 'ITC',
        type: 'stock',
        quantity: 100,
        averagePrice: 420.00,
        currentPrice: 465.00,
        amount: 42000,
        investmentMode: 'lumpsum',
        daysAgo: 400,
    },

    // =========================================================================
    // PPF / TAX SAVING (4 investments)
    // =========================================================================
    {
        name: 'Public Provident Fund',
        symbol: 'PPF',
        type: 'ppf',
        quantity: 1,
        averagePrice: 150000,
        currentPrice: 165000,
        amount: 150000,
        investmentMode: 'lumpsum',
        schemeType: 'PPF',
        daysAgo: 730,
    },
    {
        name: 'National Pension System',
        symbol: 'NPS',
        type: 'ppf',
        quantity: 1,
        averagePrice: 50000,
        currentPrice: 58500,
        amount: 50000,
        investmentMode: 'sip',
        sipFrequency: 'monthly',
        schemeType: 'NPS',
        daysAgo: 365,
    },
    {
        name: 'Employee Provident Fund',
        symbol: 'EPF',
        type: 'ppf',
        quantity: 1,
        averagePrice: 200000,
        currentPrice: 218000,
        amount: 200000,
        investmentMode: 'sip',
        sipFrequency: 'monthly',
        schemeType: 'EPF',
        daysAgo: 1095,
    },
    {
        name: 'Sukanya Samriddhi Yojana',
        symbol: 'SSY',
        type: 'ppf',
        quantity: 1,
        averagePrice: 75000,
        currentPrice: 82000,
        amount: 75000,
        investmentMode: 'lumpsum',
        daysAgo: 500,
    },

    // =========================================================================
    // OTHER (5 investments)
    // =========================================================================
    {
        name: 'Sovereign Gold Bond 2024',
        symbol: 'SGB2024',
        type: 'other',
        quantity: 10,
        averagePrice: 5200.00,
        currentPrice: 5800.00,
        amount: 52000,
        investmentMode: 'lumpsum',
        daysAgo: 180,
    },
    {
        name: 'Corporate Fixed Deposit - HDFC',
        symbol: 'HDFCFD',
        type: 'other',
        quantity: 1,
        averagePrice: 100000,
        currentPrice: 107500,
        amount: 100000,
        investmentMode: 'lumpsum',
        daysAgo: 365,
    },
    {
        name: 'RBI Floating Rate Bonds',
        symbol: 'RBIBOND',
        type: 'other',
        quantity: 5,
        averagePrice: 10000,
        currentPrice: 10000,
        amount: 50000,
        investmentMode: 'lumpsum',
        daysAgo: 90,
    },
    {
        name: 'Digital Gold',
        symbol: 'DGOLD',
        type: 'other',
        quantity: 20,
        averagePrice: 6000.00,
        currentPrice: 6500.00,
        amount: 120000,
        investmentMode: 'sip',
        sipFrequency: 'monthly',
        daysAgo: 240,
    },
    {
        name: 'Real Estate Fund',
        symbol: 'REIT',
        type: 'other',
        quantity: 50,
        averagePrice: 350.00,
        currentPrice: 385.00,
        amount: 17500,
        investmentMode: 'lumpsum',
        daysAgo: 120,
    },
];

// =============================================================================
// SEEDER FUNCTION
// =============================================================================

/**
 * Seeds mock investment data for a user.
 * Called during user registration.
 * 
 * @param userId - The new user's ID
 */
export async function seedInvestmentsForUser(userId: string | Types.ObjectId): Promise<void> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    // Check if user already has investments (skip if re-seeding)
    const existingCount = await InvestmentHolding.countDocuments({ userId: userObjectId });
    if (existingCount > 0) {
        console.log(`📊 User ${userId} already has investments, skipping seed.`);
        return;
    }

    console.log(`📊 Seeding investments for user ${userId}...`);

    const investmentsToCreate = [];
    const transactionsToCreate = [];

    for (const mock of MOCK_INVESTMENTS) {
        const investmentDate = new Date();
        investmentDate.setDate(investmentDate.getDate() - mock.daysAgo);

        // Create investment holding
        const investment = {
            userId: userObjectId,
            name: mock.name,
            symbol: mock.symbol,
            type: mock.type,
            quantity: mock.quantity,
            averagePrice: mock.averagePrice,
            currentPrice: mock.currentPrice,
            amount: mock.amount,
            investmentDate,
            investmentMode: mock.investmentMode,
            sipFrequency: mock.sipFrequency,
            schemeType: mock.schemeType,
            lastUpdated: new Date(),
        };
        investmentsToCreate.push(investment);

        // Create corresponding transaction (ledger entry)
        const transaction = {
            userId: userObjectId,
            amount: mock.amount,
            type: 'expense',
            category: 'Investments',
            merchant: mock.name,
            description: `Investment in ${mock.name} (${mock.type})`,
            date: investmentDate,
            paymentMethod: 'bank_transfer',
            isRecurring: mock.investmentMode === 'sip',
        };
        transactionsToCreate.push(transaction);
    }

    // Bulk insert
    await InvestmentHolding.insertMany(investmentsToCreate);
    await Transaction.insertMany(transactionsToCreate);

    console.log(`✅ Seeded ${investmentsToCreate.length} investments for user ${userId}`);
}

/**
 * Seeds investments for all existing users who don't have any.
 * Utility function for one-time data migration.
 */
export async function seedInvestmentsForAllUsers(): Promise<void> {
    const User = (await import('../models/user.model')).default;
    const users = await User.find({}, '_id');

    console.log(`📊 Seeding investments for ${users.length} users...`);

    for (const user of users) {
        await seedInvestmentsForUser(user._id);
    }

    console.log('✅ Finished seeding investments for all users');
}

export default {
    seedInvestmentsForUser,
    seedInvestmentsForAllUsers,
};
