import { SystemDocumentArticle } from "../docs/SystemDocumentArticle";
import { systemDocuments } from "../docs/system-documents";

export function CockpitDocsPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
          PRIVATE DOCUMENTATION
        </span>
        <h1 className="m-0 font-grotesk text-[clamp(28px,5vw,48px)] font-bold leading-none tracking-[-1px]">
          System documentation
        </h1>
        <p className="m-0 max-w-[70ch] font-mono text-[13px] leading-[1.7] text-muted-foreground">
          How your machines, the edge and this cockpit fit together, and how you
          drive them. The whole cockpit mount path sits behind an owner-only
          Cloudflare Access policy, so nothing on this page is readable by
          anyone who is not signed in as you.
        </p>
      </header>
      {systemDocuments.map((systemDocument) => (
        <SystemDocumentArticle
          key={systemDocument.id}
          systemDocument={systemDocument}
        />
      ))}
    </div>
  );
}
