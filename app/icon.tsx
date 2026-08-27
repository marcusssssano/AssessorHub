import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1f3f",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 320,
            height: 320,
            borderRadius: 64,
            background: "#2f6fed",
            color: "white",
            fontSize: 220,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          V
        </div>
      </div>
    ),
    { ...size }
  );
}
