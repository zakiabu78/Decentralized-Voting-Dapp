import { NextRequest, NextResponse } from "next/server";

// Server-only secret — do NOT prefix with NEXT_PUBLIC_.
const PINATA_JWT = process.env.PINATA_JWT;

export async function POST(req: NextRequest) {
  if (!PINATA_JWT) {
    return NextResponse.json({ error: "Server is not configured for uploads." }, { status: 500 });
  }

  const incoming = await req.formData();
  const file = incoming.get("file");
  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const forward = new FormData();
  forward.append("file", file);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: forward,
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Upload to IPFS failed." }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ ipfsHash: data.IpfsHash });
}
