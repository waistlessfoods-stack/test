import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WaistLess Foods";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #0f2d2e 0%, #1e5f61 35%, #f4efe6 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top right, rgba(251,113,24,0.42), transparent 32%), radial-gradient(circle at bottom left, rgba(255,255,255,0.18), transparent 28%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: -120,
            top: -80,
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 70,
            bottom: 60,
            width: 220,
            height: 220,
            borderRadius: 9999,
            background: "rgba(251,113,24,0.18)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "64px 72px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 64,
                height: 64,
                borderRadius: 20,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 800,
              }}
            >
              W
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 700 }}>WaistLess Foods</div>
              <div style={{ fontSize: 18, opacity: 0.82 }}>
                Private chef services, premium recipes, and mindful cooking
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 820,
              gap: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 88,
                lineHeight: 0.95,
                fontWeight: 900,
                letterSpacing: -3,
              }}
            >
              Waste Less.
              <br />
              Taste More.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                lineHeight: 1.35,
                maxWidth: 760,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Fresh, flavorful meals from Chef Amber, plus premium recipe content
              built for sustainable everyday cooking.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 20,
              color: "rgba(255,255,255,0.82)",
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <span>Services</span>
              <span>Recipes</span>
              <span>Blog</span>
            </div>
            <div>waitslessfood.com</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
