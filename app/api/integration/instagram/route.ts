import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workspaceId = body.workspaceId as number | undefined;
    const instagramBusinessId = body.instagramBusinessId as string | undefined;
    const pageId = body.pageId as string | undefined;
    const accessToken = body.accessToken as string | undefined;
    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }
    if (!instagramBusinessId || !accessToken) {
      return NextResponse.json(
        { error: "instagramBusinessId and accessToken are required" },
        { status: 400 }
      );
    }
    await sql`
      INSERT INTO workspace_integrations (
        workspace_id,
        type,
        business_id,
        page_id,
        access_token
      )
      VALUES (
        ${workspaceId},
        'instagram',
        ${instagramBusinessId},
        ${pageId ?? null},
        ${accessToken}
      )
      ON CONFLICT (workspace_id, type)
      DO UPDATE SET
        business_id = EXCLUDED.business_id,
        page_id = EXCLUDED.page_id,
        access_token = EXCLUDED.access_token,
        updated_at = NOW();
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[INTEGRATIONS_INSTAGRAM_POST_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to save Instagram integration" },
      { status: 500 }
    );
  }
}