import { revalidateTag } from "next/cache";
import { proxySecureMail } from "@/lib/securemail-proxy";
import { SECUREMAIL_CACHE_TAG } from "@/lib/securemail-api";

export async function POST(request: Request) {
  const body = await request.arrayBuffer();
  const response = await proxySecureMail("analyses", {
    method: "POST",
    body,
    headers: {
      "content-type": request.headers.get("content-type") ?? "application/json",
    },
  });
  if (response.ok) {
    try {
      revalidateTag(SECUREMAIL_CACHE_TAG, "max");
    } catch (error) {
      console.error("SecureMail cache invalidation failed", error);
    }
  }
  return response;
}
