export async function safeFetchJson(url: string, options?: RequestInit): Promise<any> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";
    
    let text = "";
    try {
      text = await res.text();
    } catch (e) {
      return { success: false, error: "রিসপন্স পড়তে ব্যর্থ হয়েছে" };
    }

    if (contentType.includes("application/json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
      try {
        const data = JSON.parse(text);
        if (!res.ok && data && typeof data === "object") {
          return {
            success: false,
            ...data,
            error: data.error || data.message || `HTTP error ${res.status}`,
          };
        }
        return data;
      } catch (e) {
        console.warn(`JSON parse error from ${url}:`, e);
      }
    }

    if (!res.ok) {
      return { success: false, error: `সার্ভার সমস্যা (কোড ${res.status})` };
    }

    return { success: false, error: "অবৈধ সার্ভিস রিসপন্স" };
  } catch (err: any) {
    console.error(`Fetch exception for ${url}:`, err);
    return { success: false, error: err?.message || "নেটওয়ার্ক সংযোগে সমস্যা হয়েছে" };
  }
}
