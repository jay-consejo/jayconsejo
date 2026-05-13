import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const alt = "Jay Consejo — AI, Web Apps & Systems Builder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
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
        <div
          style={{
            display: "flex",
            fontSize: 44,
            color: "#C8A87E",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {siteConfig.logo}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 34,
              color: "#B0ADA8",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            {siteConfig.name}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 88,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#F5F0EB",
              maxWidth: 1000,
            }}
          >
            <span>AI, web apps &amp; systems,&nbsp;</span>
            <span style={{ color: "#C8A87E", fontStyle: "italic" }}>
              shipped in weeks.
            </span>
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 26,
              color: "#B0ADA8",
              display: "flex",
              gap: 32,
            }}
          >
            <span>jayconsejo.com</span>
            <span style={{ color: "#6B6B73" }}>·</span>
            <span>6 products · 18 agents</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
