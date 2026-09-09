import { proxySecureMail } from "@/lib/securemail-proxy";

export async function GET(request: Request) {
  const query = new URL(request.url).search;
  return proxySecureMail(`capture-jobs${query}`);
}

export async function POST(request: Request) {
  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return Response.json({ detail: "A multipart PCAP upload is required" }, { status: 400 });
  }

  const file = incoming.get("file");
  if (!(file instanceof File)) {
    return Response.json({ detail: "A PCAP file is required" }, { status: 400 });
  }

  const form = new FormData();
  form.append("file", file, file.name);
  return proxySecureMail("capture-jobs", { method: "POST", body: form });
}
