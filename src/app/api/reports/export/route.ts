import { withAuth } from "@/lib/api/handler";
import { getReports } from "@/lib/services/report.service";
import { toCsv } from "@/lib/csv";

// Stream the per-vehicle analytics as a downloadable CSV.
export const GET = withAuth(
  async () => {
    const report = await getReports();
    const csv = toCsv(
      report.vehicles,
      [
        { key: "registrationNo", header: "Registration" },
        { key: "name", header: "Name" },
        { key: "type", header: "Type" },
        { key: "acquisitionCost", header: "Acquisition Cost" },
        { key: "fuelCost", header: "Fuel Cost" },
        { key: "fuelLiters", header: "Fuel (L)" },
        { key: "maintenanceCost", header: "Maintenance Cost" },
        { key: "expenseCost", header: "Other Expenses" },
        { key: "operationalCost", header: "Operational Cost" },
        { key: "revenue", header: "Revenue" },
        { key: "distanceKm", header: "Distance (km)" },
        { key: "fuelEfficiency", header: "Efficiency (km/L)" },
        { key: "roi", header: "ROI" },
      ],
    );

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transitops-report.csv"`,
      },
    });
  },
  { module: "reports", level: "view" },
);
