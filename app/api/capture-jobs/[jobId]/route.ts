import { proxySecureMail } from "@/lib/securemail-proxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  return proxySecureMail(`capture-jobs/${encodeURIComponent(jobId)}`);
}
