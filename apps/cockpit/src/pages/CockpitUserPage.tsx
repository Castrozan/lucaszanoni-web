import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@platform/design-system";
import { OWNER_ACCESS_LOGOUT_PATH } from "../identity/owner-access-identity";
import { useOwnerAccessIdentity } from "../identity/use-owner-access-identity";

export function CockpitUserPage() {
  const ownerAccessIdentity = useOwnerAccessIdentity();
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
          OWNER ACCOUNT
        </span>
        <h1 className="m-0 font-grotesk text-[clamp(28px,5vw,48px)] font-bold leading-none tracking-[-1px]">
          Your account
        </h1>
        <p className="m-0 max-w-[60ch] font-mono text-[13px] leading-[1.6] text-muted-foreground">
          Identity comes from the Cloudflare Access session at runtime. Nothing
          here is baked into the build.
        </p>
      </header>

      <section aria-label="Account identity" className="max-w-[40rem]">
        <Card>
          <CardHeader>
            <CardTitle>Signed in</CardTitle>
            <CardDescription>
              {ownerAccessIdentity
                ? "Verified by the Cloudflare Access JWT."
                : "Identity resolves once the Access session is present."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <dl className="grid grid-cols-[6rem_1fr] gap-y-3 text-sm">
              <dt className="font-mono uppercase tracking-[1px] text-text-faint">
                Name
              </dt>
              <dd className="m-0 text-foreground">
                {ownerAccessIdentity ? ownerAccessIdentity.name : "—"}
              </dd>
              <dt className="font-mono uppercase tracking-[1px] text-text-faint">
                Email
              </dt>
              <dd className="m-0 text-foreground">
                {ownerAccessIdentity ? ownerAccessIdentity.email : "—"}
              </dd>
            </dl>
            <Button asChild variant="outline" size="sm" className="self-start">
              <a href={OWNER_ACCESS_LOGOUT_PATH}>Log out</a>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
