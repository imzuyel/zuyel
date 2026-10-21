import { redirect } from "next/navigation";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const callbackUrl = resolvedParams?.callbackUrl;
  const query = callbackUrl
    ? `?role=admin&callbackUrl=${encodeURIComponent(String(callbackUrl))}`
    : `?role=admin`;
  redirect(`/login${query}`);
}
