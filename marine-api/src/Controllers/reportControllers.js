import exceljs from "exceljs";
import { getPrismaClient } from "../config/db.js";

const prisma = getPrismaClient();

const parseDate = (input) => {
  if (!input) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const exportProductionreport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const gte = parseDate(startDate);
    const lte = parseDate(endDate);

    if (!gte || !lte) {
      return res.status(400).json({
        error: "startDate and endDate are required ISO-8601 date strings",
      });
    }
    if (gte > lte) {
      return res.status(400).json({ error: "startDate must be before endDate" });
    }

    const policies = await prisma.policy.findMany({
      where: { createdAt: { gte, lte } },
      include: { quote: true },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("Production Report");
    worksheet.columns = [
      { header: "Policy Number", key: "policyNumber", width: 30 },
      { header: "Customer Name", key: "customerName", width: 30 },
      { header: "Cargo Type", key: "cargoType", width: 20 },
      { header: "Cargo Value", key: "cargoValue", width: 15 },
      { header: "Premium", key: "premium", width: 15 },
      { header: "Status", key: "status", width: 20 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    for (const policy of policies) {
      worksheet.addRow({
        policyNumber: policy.policyNumber,
        customerName: policy.customerName,
        cargoType: policy.quote?.cargoType,
        cargoValue: policy.quote?.cargoValue,
        premium: policy.quote?.premium,
        status: policy.status,
        createdAt: policy.createdAt,
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="production-report.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("exportProductionreport error:", error);
    res.status(500).json({ error: "Failed to export production report" });
  }
};
