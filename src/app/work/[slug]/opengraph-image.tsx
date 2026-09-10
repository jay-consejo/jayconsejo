import { ImageResponse } from "next/og";
import { getCase, publishedWork } from "@/lib/work";
import { siteConfig } from "@/lib/site-config";

export const alt = "Case study — Jay Consejo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return publishedWork.map((w) => ({ slug: w.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getCase(slug);
  const title = item?.title ?? "Work";
  const tag = item?.tag ?? "Case study";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "radial-gradient(ellipse at 78% 22%, rgba(200,168,126,0.22), transparent 55%), #0B0B0F",
          color: "#F5F0EB",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 44, color: "#C8A87E", fontWeight: 700 }}>
          {siteConfig.logo}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 26,
              color: "#C8A87E",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {tag}
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div style={{ marginTop: 20, fontSize: 26, color: "#B0ADA8", display: "flex", gap: 32 }}>
            <span>jayconsejo.com/work</span>
            <span style={{ color: "#6B6B73" }}>·</span>
            <span>Case study by {siteConfig.name}</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
