import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for jayconsejo.com",
};

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
            <p className="mt-2">
              When you use our contact form, we collect the information you
              provide: your name, email address, and message content. We do not
              collect data automatically through cookies or tracking scripts,
              except as described under Analytics and Security below.
            </p>
          </section>

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
            <p className="mt-2">
              We use the information you provide solely to respond to your
              inquiry and to communicate about potential projects. We do not
              sell, rent, or share your personal information with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Data Retention
            </h2>
            <p className="mt-2">
              We retain your contact information only as long as necessary to
              fulfill the purpose for which it was collected. You may request
              deletion of your data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Your Rights
            </h2>
            <p className="mt-2">
              You have the right to access, correct, or delete the personal data
              we hold about you. To exercise these rights, please contact us
              using the information below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Contact</h2>
            <p className="mt-2">
              For questions about this privacy policy or your data, please reach
              out through our{" "}
              <Link
                href="/#contact"
                className="font-medium text-foreground underline underline-offset-4"
              >
                contact form
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
