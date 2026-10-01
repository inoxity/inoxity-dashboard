import { redirect } from "next/navigation";
import { DOCS_URL } from "@/lib/links";

// The docs now live on Read the Docs (built from docs/ in this repo). This
// route stays only so old bookmarks to /dashboard/docs still land there.
export default function DocsPage() {
  redirect(DOCS_URL);
}
