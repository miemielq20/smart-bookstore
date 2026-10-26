import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const paidStatuses = [
  'PAID',
  'SHIPPED',
  'COMPLETED',
  'AFTER_SALE',
  'REFUNDING',
] as const;
const dayMs = 24 * 60 * 60 * 1000;

type TrendRow = {
  date: string;
  label: string;
  orders: number;
  revenue: number;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(days: number) {
    const now = new Date();
    const periodStart = this.startOfDay(
      new Date(now.getTime() - (days - 1) * dayMs),
    );
    const previousStart = this.startOfDay(
      new Date(periodStart.getTime() - days * dayMs),
    );
    const periodEnd = new Date(now.getTime() + dayMs);

    const [
      books,
      orders,
      previousOrders,
      statusGroups,
      booksCount,
      stock,
      newUsers,
      previousUsers,
      categories,
      relations,
    ] = await Promise.all([
      this.prisma.books.findMany({
        where: { deletedAt: null },
        orderBy: [{ salesCount: 'desc' }, { viewCount: 'desc' }],
        take: 20,
        select: {
          id: true,
          title: true,
          author: true,
          price: true,
          salesCount: true,
          viewCount: true,
          stock: true,
        },
      }),
      this.prisma.orders.findMany({
        where: { createdAt: { gte: periodStart, lt: periodEnd } },
        select: {
          userId: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.orders.findMany({
        where: { createdAt: { gte: previousStart, lt: periodStart } },
        select: { userId: true, totalAmount: true, status: true },
      }),
      this.prisma.orders.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.books.count({ where: { deletedAt: null } }),
      this.prisma.books.aggregate({
        where: { deletedAt: null },
        _sum: { stock: true },
      }),
      this.prisma.userAccounts.count({
        where: {
          status: 1,
          deletedAt: null,
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      }),
      this.prisma.userAccounts.count({
        where: {
          status: 1,
          deletedAt: null,
          createdAt: { gte: previousStart, lt: periodStart },
        },
      }),
      this.prisma.categories.findMany({
        where: { status: 1 },
        select: { id: true, name: true },
      }),
      this.prisma.bookCategoryRelations.findMany({
        select: { bookId: true, categoryId: true },
      }),
    ]);

    const trend = this.buildTrend(periodStart, days, orders);
    const revenueOrders = orders.filter((order) => this.isPaid(order.status));
    const previousRevenueOrders = previousOrders.filter((order) =>
      this.isPaid(order.status),
    );
    const revenue = this.sumAmounts(revenueOrders);
    const previousRevenue = this.sumAmounts(previousRevenueOrders);
    const activeUserIds = new Set(
      revenueOrders.map((order) => order.userId.toString()),
    );
    const previousActiveUserIds = new Set(
      previousRevenueOrders.map((order) => order.userId.toString()),
    );
    const statusCounts = Object.fromEntries(
      statusGroups.map((item) => [item.status, item._count._all]),
    );
    const categoryNames = new Map(
      categories.map((category) => [category.id, category.name]),
    );
    const bookById = new Map(books.map((book) => [book.id.toString(), book]));
    const categoryTotals = new Map<number, number>();

    relations.forEach((relation) => {
      const book = bookById.get(relation.bookId.toString());
      if (book)
        categoryTotals.set(
          relation.categoryId,
          (categoryTotals.get(relation.categoryId) ?? 0) + book.salesCount,
        );
    });

    return {
      source: orders.length || booksCount ? 'database' : 'empty',
      days,
      period: { from: periodStart.toISOString(), to: now.toISOString() },
      metrics: {
        orders: orders.length,
        revenue,
        activeUsers: activeUserIds.size,
        newUsers,
        books: booksCount,
        stock: stock._sum.stock ?? 0,
        pendingOrders:
          (statusCounts.PENDING ?? 0) +
          (statusCounts.PAID ?? 0) +
          (statusCounts.AFTER_SALE ?? 0) +
          (statusCounts.REFUNDING ?? 0),
        averageOrderValue: revenueOrders.length
          ? Number((revenue / revenueOrders.length).toFixed(2))
          : 0,
      },
      changes: {
        orders: this.changeRate(orders.length, previousOrders.length),
        revenue: this.changeRate(revenue, previousRevenue),
        activeUsers: this.changeRate(
          activeUserIds.size,
          previousActiveUserIds.size,
        ),
        newUsers: this.changeRate(newUsers, previousUsers),
      },
      trend,
      statuses: [
        {
          key: 'COMPLETED',
          label: '已完成',
          value: statusCounts.COMPLETED ?? 0,
          color: '#5c7c61',
        },
        {
          key: 'SHIPPED',
          label: '待收货',
          value: statusCounts.SHIPPED ?? 0,
          color: '#9b7653',
        },
        {
          key: 'PAID',
          label: '待发货',
          value: statusCounts.PAID ?? 0,
          color: '#b68a3a',
        },
        {
          key: 'PENDING',
          label: '待付款',
          value: statusCounts.PENDING ?? 0,
          color: '#c76d4b',
        },
        {
          key: 'AFTER_SALE',
          label: '售后中',
          value: (statusCounts.AFTER_SALE ?? 0) + (statusCounts.REFUNDING ?? 0),
          color: '#8f5d67',
        },
        {
          key: 'CANCELLED',
          label: '已取消',
          value:
            (statusCounts.CANCELLED ?? 0) +
            (statusCounts.REFUNDED ?? 0) +
            (statusCounts.REJECTED ?? 0),
          color: '#9a9b8f',
        },
      ],
      topBooks: books.slice(0, 5).map((book, index) => ({
        rank: index + 1,
        id: Number(book.id),
        title: book.title,
        author: book.author,
        sales: book.salesCount,
        revenue: Number((book.salesCount * Number(book.price)).toFixed(2)),
        views: book.viewCount,
        stock: book.stock,
        category: this.bookCategory(book.id, relations, categoryNames),
      })),
      categories: [...categoryTotals.entries()]
        .map(([id, value]) => ({
          name: categoryNames.get(id) ?? '未分类',
          value,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    };
  }

  async traffic(days: number) {
    const now = new Date();
    const periodStart = this.startOfDay(
      new Date(now.getTime() - (days - 1) * dayMs),
    );
    const records = await this.prisma.browseHistory.findMany({
      where: {
        browsedAt: { gte: periodStart, lt: new Date(now.getTime() + dayMs) },
      },
      select: {
        userId: true,
        bookId: true,
        duration: true,
        source: true,
        browsedAt: true,
      },
    });
    const trend = this.buildTrafficTrend(periodStart, days, records);
    const sourceCounts = new Map<string, number>();
    const bookCounts = new Map<string, number>();
    records.forEach((record) => {
      const source = record.source?.trim() || '直接访问';
      sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
      const bookId = record.bookId.toString();
      bookCounts.set(bookId, (bookCounts.get(bookId) ?? 0) + 1);
    });
    const viewedBookIds = [...bookCounts.keys()].map((id) => BigInt(id));
    const viewedBooks = viewedBookIds.length
      ? await this.prisma.books.findMany({
          where: { id: { in: viewedBookIds } },
          select: { id: true, title: true, author: true, viewCount: true },
        })
      : [];
    const viewedBookMap = new Map(
      viewedBooks.map((book) => [book.id.toString(), book]),
    );
    const totalVisitors = new Set(
      records.map((record) => record.userId.toString()),
    ).size;
    const totalDuration = records.reduce(
      (sum, record) => sum + Number(record.duration ?? 0),
      0,
    );

    return {
      source: records.length ? 'database' : 'empty',
      days,
      metrics: {
        pageViews: records.length,
        uniqueVisitors: totalVisitors,
        averageDuration: records.length
          ? Math.round(totalDuration / records.length)
          : 0,
        bounceRate: this.bounceRate(records),
      },
      trend,
      sources: [...sourceCounts.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      topBooks: [...bookCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, value], index) => ({
          rank: index + 1,
          title: viewedBookMap.get(id)?.title ?? '已下架图书',
          author: viewedBookMap.get(id)?.author ?? '-',
          views: value,
          totalViews: viewedBookMap.get(id)?.viewCount ?? value,
        })),
    };
  }

  private buildTrend(
    start: Date,
    days: number,
    orders: Array<{ createdAt: Date; totalAmount: unknown; status: string }>,
  ): TrendRow[] {
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(start.getTime() + index * dayMs);
      const key = this.dateKey(date);
      const dayOrders = orders.filter(
        (order) => this.dateKey(order.createdAt) === key,
      );
      const paid = dayOrders.filter((order) => this.isPaid(order.status));
      return {
        date: key,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        orders: dayOrders.length,
        revenue: this.sumAmounts(paid),
      };
    });
  }

  private buildTrafficTrend(
    start: Date,
    days: number,
    records: Array<{
      browsedAt: Date;
      userId: bigint;
      duration: number | null;
    }>,
  ) {
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(start.getTime() + index * dayMs);
      const key = this.dateKey(date);
      const dayRecords = records.filter(
        (record) => this.dateKey(record.browsedAt) === key,
      );
      return {
        date: key,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        pageViews: dayRecords.length,
        uniqueVisitors: new Set(
          dayRecords.map((record) => record.userId.toString()),
        ).size,
        averageDuration: dayRecords.length
          ? Math.round(
              dayRecords.reduce(
                (sum, record) => sum + Number(record.duration ?? 0),
                0,
              ) / dayRecords.length,
            )
          : 0,
      };
    });
  }

  private bookCategory(
    bookId: bigint,
    relations: Array<{ bookId: bigint; categoryId: number }>,
    names: Map<number, string>,
  ) {
    return relations.find((relation) => relation.bookId === bookId)?.categoryId
      ? (names.get(
          relations.find((relation) => relation.bookId === bookId)!.categoryId,
        ) ?? '未分类')
      : '未分类';
  }

  private sumAmounts(rows: Array<{ totalAmount: unknown }>) {
    return Number(
      rows.reduce((sum, row) => sum + Number(row.totalAmount), 0).toFixed(2),
    );
  }

  private isPaid(status: string) {
    return paidStatuses.includes(status as (typeof paidStatuses)[number]);
  }

  private changeRate(current: number, previous: number) {
    if (previous === 0) return current === 0 ? 0 : 100;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private bounceRate(records: Array<{ userId: bigint }>) {
    if (!records.length) return 0;
    const visits = new Map<string, number>();
    records.forEach((record) =>
      visits.set(
        record.userId.toString(),
        (visits.get(record.userId.toString()) ?? 0) + 1,
      ),
    );
    const bounced = [...visits.values()].filter((count) => count === 1).length;
    return Number(((bounced / visits.size) * 100).toFixed(1));
  }

  private dateKey(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const date = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }

  private startOfDay(value: Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
}
