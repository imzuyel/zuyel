import { NextRequest } from "next/server";
import { POST as handlePost } from "../answers/route";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handlePost(req, context);
}
