import React from "react";

interface ProximamenteBadgeProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function ProximamenteBadge({ className, style }: ProximamenteBadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F5F5F7",
        color: "#86868B",
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        padding: "2px 8px",
        borderRadius: "9999px",
        lineHeight: "1.4",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
        userSelect: "none",
        ...style,
      }}
    >
      PRÓXIMAMENTE
    </span>
  );
}
