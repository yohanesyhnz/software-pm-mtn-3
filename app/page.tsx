import { readFileSync } from "node:fs";
import { join } from "node:path";
import LegacyDashboardScripts from "./LegacyDashboardScripts";

function getLegacyDashboardMarkup() {
  const source = readFileSync(join(process.cwd(), "index.html"), "utf8");
  const body = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];

  if (!body) {
    throw new Error("Legacy dashboard body could not be read from index.html");
  }

  return body.replace(/<script\b[^>]*\bsrc=["']app\.js[^"']*["'][^>]*><\/script>/gi, "");
}

export default function HomePage() {
  return (
    <>
      <div className="legacy-dashboard-root" dangerouslySetInnerHTML={{ __html: getLegacyDashboardMarkup() }} />
      <LegacyDashboardScripts />
    </>
  );
}
