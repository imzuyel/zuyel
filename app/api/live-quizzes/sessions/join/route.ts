import { NextRequest } from "next/server";
import { POST as joinPost } from "@/app/api/live-quizzes/join/route";

export async function POST(req: NextRequest) {
  return joinPost(req);
}
