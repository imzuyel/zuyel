import { NextRequest, NextResponse } from "next/server";
import { getAISettings, saveAISettings, AISettings } from "@/lib/aiConfigStore";
import { requireAdmin } from "@/lib/serverAuthGuard";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req, "/api/admin/ai-settings");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const settings = getAISettings();
    // Mask API keys for security before sending to client
    const maskedSettings = {
      ...settings,
      providers: settings.providers.map(p => ({
        ...p,
        apiKey: p.apiKey ? `${p.apiKey.substring(0, 4)}...${p.apiKey.substring(p.apiKey.length - 4)}` : ""
      }))
    };

    return NextResponse.json({ success: true, settings: maskedSettings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req, "/api/admin/ai-settings");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body: AISettings = await req.json();
    const currentSettings = getAISettings();

    // Preserve existing API keys if the new ones are masked (indicates no change)
    const updatedProviders = body.providers.map(newP => {
      const currentP = currentSettings.providers.find(p => p.id === newP.id);
      
      if (newP.apiKey && newP.apiKey.includes("...")) {
        return { ...newP, apiKey: currentP?.apiKey || "" };
      }
      return newP;
    });

    const success = saveAISettings({
      ...body,
      providers: updatedProviders
    });

    if (success) {
      return NextResponse.json({ success: true, message: "AI Settings updated successfully." });
    } else {
      throw new Error("Failed to save settings to disk.");
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
