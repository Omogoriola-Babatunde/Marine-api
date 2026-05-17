import exceljs from 'exceljs';
import { getPrismaClient } from '../config/db.js';

const prisma = getPrismaClient();

export const exportProductionreport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const reports = await prisma.report.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        quote: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Production Report');       
    worksheet.columns = [
        { header: 'Policy Number', key: 'policyNumber', width: 30 },
        { header: 'Customer Name', key: 'customerName', width: 30 },
        { header: 'Cargo Type', key: 'cargoType', width: 20 },
        { header: 'Sum Insured', key: 'sumInsured', width: 15 },
        { header: 'Premium', key: 'premium', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    reports.forEach(report => {
        worksheet.addRow({
            policyNumber: report.quote.policyNumber,
            customerName: report.quote.customerName,
            cargoType: report.quote.cargoType,
            sumInsured: report.quote.sumInsured,
            premium: report.quote.premium,
            status: report.quote.status,
            createdAt: report.quote.createdAt,
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=production-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting production report:', error);
    res.status(500).json({ error: 'Failed to export production report' });
  }
};
