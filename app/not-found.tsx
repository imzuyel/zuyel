import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">
        ৪০৪ — পৃষ্ঠা পাওয়া যায়নি
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        দুঃখিত, আপনি যে পৃষ্ঠাটি খুঁজছেন তা পাওয়া যায়নি।
      </p>
      <Link
        href="/"
        className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
      >
        হোম পেজে ফিরে যান
      </Link>
    </div>
  );
}
