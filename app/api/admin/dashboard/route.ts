import { db } from '@/lib/db';
import { user, orders, enquiries, subscribers } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { desc, limit } from 'drizzle-orm';

/**
 * POST /api/admin/dashboard
 * Authenticates with admin password and returns dashboard statistics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // Verify admin password
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Admin access not configured' },
        { status: 500 }
      );
    }

    if (!password || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Fetch all statistics in parallel
    const [
      allUsers,
      allOrders,
      allEnquiries,
      allSubscribers,
      recentUsersList,
      recentOrdersList,
      recentEnquiriesList,
    ] = await Promise.all([
      // Total counts
      db.select().from(user),
      db.select().from(orders),
      db.select().from(enquiries),
      db.select().from(subscribers),
      // Recent items (10 most recent)
      db.select().from(user).orderBy(desc(user.createdAt)).limit(10),
      db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(10),
      db
        .select()
        .from(enquiries)
        .orderBy(desc(enquiries.createdAt))
        .limit(10),
    ]);

    // Calculate revenue
    const totalRevenue = allOrders
      .filter((o) => o.status === 'completed')
      .reduce((sum, order) => sum + (order.amount || 0), 0);

    const stats = {
      totalAccounts: allUsers.length,
      totalOrders: allOrders.length,
      totalRevenue,
      totalEnquiries: allEnquiries.length,
      totalSubscribers: allSubscribers.length,
      recentAccounts: recentUsersList.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
      })),
      recentOrders: recentOrdersList.map((o) => ({
        id: o.id,
        userId: o.userId,
        amount: o.amount,
        status: o.status,
        createdAt: o.createdAt,
        customerEmail: o.customerEmail || 'N/A',
      })),
      recentEnquiries: recentEnquiriesList.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        type: e.type,
        createdAt: e.createdAt,
      })),
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/dashboard
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    method: 'POST',
    description: 'Authenticate with admin password and retrieve dashboard statistics',
    body: {
      password: 'string (required) - admin password from ADMIN_PASSWORD env var',
    },
    response: {
      stats: {
        totalAccounts: 'number',
        totalOrders: 'number',
        totalRevenue: 'number (cents)',
        totalEnquiries: 'number',
        totalSubscribers: 'number',
        recentAccounts: 'array of last 10 accounts',
        recentOrders: 'array of last 10 orders',
        recentEnquiries: 'array of last 10 enquiries',
      },
    },
  });
}
