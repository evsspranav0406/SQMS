
import Table from '../models/Table.js';
import Waiter from '../models/Waiter.js';
import Reservation from '../models/Reservation.js';
import { toISTDateString } from '../utils/dateUtils.js';

export const getDashboardStatus = async (req, res) => {
  try {
    // Aggregate tables status counts
    const tables = await Table.find({});
    const tableStatusCounts = tables.reduce((acc, table) => {
      acc[table.status] = (acc[table.status] || 0) + 1;
      return acc;
    }, {});
    const totalTables = tables.length;

    // Aggregate waiters status counts
    const waiters = await Waiter.find({});
    const waiterStatusCounts = waiters.reduce((acc, waiter) => {
      acc[waiter.status] = (acc[waiter.status] || 0) + 1;
      return acc;
    }, {});
    const totalWaiters = waiters.length;

    // Get today's date string in IST YYYY-MM-DD format
    const todayStr = toISTDateString(new Date());

    // Aggregate reservations counts for today only
    const reservations = await Reservation.find({ date: todayStr });
    // Define checked-in status as 'checked-in' (adjust if needed)
    const checkedInCount = reservations.filter(r => r.status === 'checked-in').length;
    // Upcoming reservations with status 'pending' or 'active'
    const upcomingCount = reservations.filter(r => r.status === 'pending' || r.status === 'active').length;
    const totalReservations = reservations.filter(r => r.status==='active' ||r.status ==='checked-in' || r.status === 'cancelled'|| r.status==='completed').length;
    const completedReservations = reservations.filter(r => r.status === 'completed').length;
    const cancelledReservations = reservations.filter(r => r.status === 'cancelled').length;
    // Find reservations for today (excluding cancelled)
    const todaysReservations = await Reservation.find({ date: todayStr, status: { $ne: 'cancelled' } });

    res.json({
      tables: {
        total: totalTables,
        statusCounts: tableStatusCounts,
      },
      waiters: {
        total: totalWaiters,
        statusCounts: waiterStatusCounts,
      },
      reservations: {
        total: totalReservations,
        checkedIn: checkedInCount,
        upcoming: upcomingCount,
        completed: completedReservations,
        cancelled: cancelledReservations,
        todaysReservations: todaysReservations,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard status:', error);
    res.status(500).json({ message: 'Server error fetching dashboard status' });
  }
};

export const getReservationAnalytics = async (req, res) => {
  try {
    // Aggregate reservations count by date and status for last 30 days
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 29); // last 30 days including today

    const todayStr = toISTDateString(today);
    const pastDateStr = toISTDateString(pastDate);
    const analytics = await Reservation.aggregate([
      {
        $match: {
          date: { $gte: pastDateStr, $lte: todayStr },
        },
      },
      {
        $group: {
          _id: { date: "$date", status: "$status" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
    ]);

    // Reshape data to have counts per date for each status
    const dateStatusCounts = {};
    analytics.forEach(item => {
      const date = item._id.date;
      const status = item._id.status;
      if (!dateStatusCounts[date]) {
        dateStatusCounts[date] = { total: 0, cancelled: 0, completed: 0 };
      }
      dateStatusCounts[date].total += item.count;
      if (status === 'cancelled') {
        dateStatusCounts[date].cancelled = item.count;
      }
      if (status === 'completed') {
        dateStatusCounts[date].completed = item.count;
      }
    });

    const result = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(pastDate);
      date.setDate(pastDate.getDate() + i);
      const dateStr = toISTDateString(date);
      result.push({
        date: dateStr,
        total: dateStatusCounts[dateStr]?.total || 0,
        cancelled: dateStatusCounts[dateStr]?.cancelled || 0,
        completed: dateStatusCounts[dateStr]?.completed || 0,
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching reservation analytics:', error);
    res.status(500).json({ message: 'Server error fetching reservation analytics' });
  }
};

export const getFinancialAnalytics = async (req, res) => {
  try {
    // Aggregate total payment amount by date for last 30 days
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 29); // last 30 days including today
  
    const todayStr = toISTDateString(today)
    const pastDateStr = toISTDateString(pastDate)
    const analytics = await Reservation.aggregate([
      {
        $match: {
          date: { $gte: pastDateStr, $lte: todayStr },
          'payment.status': 'paid', // consider only completed payments
        },
      },
      {
        $group: {
          _id: "$date",
          totalAmount: { $sum: "$payment.amount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Fill missing dates with totalAmount 0
    const dateAmounts = {};
    analytics.forEach(item => {
      dateAmounts[item._id] = item.totalAmount;
    });

    const result = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(pastDate);
      date.setDate(pastDate.getDate() + i);
      const dateStr = toISTDateString(date)
      result.push({
        date: dateStr,
        totalAmount: dateAmounts[dateStr] || 0,
      });
    }
    res.json(result);
  } catch (error) {
    console.error('Error fetching financial analytics:', error);
    res.status(500).json({ message: 'Server error fetching financial analytics' });
  }
};
