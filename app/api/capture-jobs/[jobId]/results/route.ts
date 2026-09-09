import { proxySecureMail } from "@/lib/securemail-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const query = new URL(request.url).search;
  return proxySecureMail(`capture-jobs/${encodeURIComponent(jobId)}/results${query}`);
}
