import { NextRequest } from "next/server";
import {
  GET as sessionsJoinGet,
  POST as sessionsJoinPost,
} from "@/app/api/live-quizzes/sessions/join/route";

export async function GET(req: NextRequest) {
  return sessionsJoinGet(req);
}

export async function POST(req: NextRequest) {
  return sessionsJoinPost(req);
}
