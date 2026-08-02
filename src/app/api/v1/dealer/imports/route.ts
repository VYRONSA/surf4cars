import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import {
  buildImportReportCsv,
  getImportBatch,
  listImportBatches,
} from "@/features/dealer-migration/server/import-history";

/** Every import this dealership has run — or one of them as a downloadable report. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dealershipId = url.searchParams.get("dealershipId")?.trim();
    if (!dealershipId) {
      return NextResponse.json({ error: "A dealership is required." }, { status: 400 });
    }

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:inventory:read"],
    });

    const reportBatchId = url.searchParams.get("report")?.trim();
    if (reportBatchId) {
      const batch = await getImportBatch(reportBatchId, dealershipId, access.accessToken);
      if (!batch) {
        return NextResponse.json({ error: "That import does not exist." }, { status: 404 });
      }

      const fileName = `import-report-${reportBatchId.slice(0, 8)}.csv`;
      return new NextResponse(buildImportReportCsv(batch), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="${fileName}"`,
          /* A report is a snapshot of one run and never changes, but it also contains a dealership's
             stock and must not sit in a shared cache. */
          "cache-control": "private, no-store",
        },
      });
    }

    const batches = await listImportBatches(dealershipId, access.accessToken);
    return NextResponse.json({ batches });
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to load imports.");
  }
}
