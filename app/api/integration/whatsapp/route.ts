import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workspaceId = body.workspaceId as number | undefined;
    const phoneNumber = body.phoneNumber as string | undefined;
    const phoneNumberId = body.phoneNumberId as string | undefined;
    const businessId = body.businessId as string | undefined;
    const accessToken = body.accessToken as string | undefined;
    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }
    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        { error: "phoneNumberId and accessToken are required" },
        { status: 400 }
      );
    }
    await sql`
      INSERT INTO workspace_integrations (
        workspace_id,
        type,
        phone_number,
        phone_number_id,
        business_id,
        access_token
      )
      VALUES (
        ${workspaceId},
        'whatsapp',
        ${phoneNumber ?? null},
        ${phoneNumberId},
        ${businessId ?? null},
        ${accessToken}
      )
      ON CONFLICT (workspace_id, type)
      DO UPDATE SET
        phone_number = EXCLUDED.phone_number,
        phone_number_id = EXCLUDED.phone_number_id,
        business_id = EXCLUDED.business_id,
        access_token = EXCLUDED.access_token,
        updated_at = NOW();
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[INTEGRATIONS_WHATSAPP_POST_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to save WhatsApp integration" },
      { status: 500 }
    );
  }
}