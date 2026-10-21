import type { Metadata } from "next";
import { JAY_EMAIL } from "@/components/sections/contact-email";
import { privacyCopy } from "@/lib/privacy-copy";
import { SOFIA_ONLINE } from "@/lib/sofia-switch";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for jayconsejo.com",
};

const copy = privacyCopy({ online: SOFIA_ONLINE });

const emailLink = (
  <a
    href={`mailto:${JAY_EMAIL}`}
    className="font-medium text-foreground underline underline-offset-4"
  >
    {JAY_EMAIL}
  </a>
);

export default function PrivacyPage() {
  return (
    <div className="px-6 pb-20 pt-32">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: October 2026
        </p>

        <div className="mt-8 space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Information We Collect
            </h2>
            {copy.collected.map((p) => (
              <p key={p} className="mt-2">
                {p}
              </p>
            ))}
          </section>

          {copy.call.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-foreground">
                Calls with Sofia
              </h2>
              {copy.call.map((p) => (
                <p key={p} className="mt-2">
                  {p}
                </p>
              ))}
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Analytics and Security
            </h2>
            <p className="mt-2">
              This site runs through Cloudflare. Cloudflare Web Analytics counts
              page views and measures how fast pages load, along with the
              referring site, browser, device type and country. It does not use
              cookies or local storage, and it does not build a profile of you.
            </p>
            <p className="mt-2">
              Cloudflare also checks that visitors are not automated bots. That
              check sets one cookie, <code>cf_clearance</code>, which records that
              your browser passed. It is not used for analytics or advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              How We Use Your Information
            </h2>
            {copy.use.map((p) => (
              <p key={p} className="mt-2">
                {p}
              </p>
            ))}
            <ul className="mt-2 list-disc space-y-1 pl-6">
              {copy.providers.map((s) => (
                <li key={s.name}>
                  <span className="font-medium text-foreground">{s.name}</span>{" "}
                  {s.use}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Data Retention
            </h2>
            {copy.retention.map((p) => (
              <p key={p} className="mt-2">
                {p}
              </p>
            ))}
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Your Rights
            </h2>
            <p className="mt-2">
              You have the right to access, correct, or delete the personal data
              we hold about you. To exercise these rights, email us at the
              address below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Contact</h2>
            <p className="mt-2">
              For questions about this privacy policy or your data, email{" "}
              {emailLink}.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
