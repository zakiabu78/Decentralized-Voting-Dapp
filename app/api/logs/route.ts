import { NextRequest, NextResponse } from "next/server";

// Server-only secret — do NOT prefix with NEXT_PUBLIC_.
const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY;
const ETHERSCAN_BASE = "https://api.etherscan.io/v2/api";

export async function GET(req: NextRequest) {
  if (!ETHERSCAN_KEY) {
    return NextResponse.json({ error: "Server is not configured for log lookups." }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const chainid = searchParams.get("chainid");
  const address = searchParams.get("address");
  const fromBlock = searchParams.get("fromBlock");
  const toBlock = searchParams.get("toBlock") || "latest";

  if (!chainid || !address || !fromBlock) {
    return NextResponse.json({ error: "Missing required query params." }, { status: 400 });
  }

  const url = `${ETHERSCAN_BASE}?chainid=${chainid}&module=logs&action=getLogs`
    + `&address=${address}&fromBlock=${fromBlock}&toBlock=${toBlock}&apikey=${ETHERSCAN_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "Etherscan request failed." }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
