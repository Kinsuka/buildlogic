import React from "react";

export default function BtnMenu({onClick, active, color, bg, children, last}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "10px 14px",
        fontSize: 12,
        background: active ? bg : "none",
        border: "none",
        borderBottom: last ? "none" : "1px solid var(--bd)",
        color: active ? color : "var(--tx)",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {children}
    </button>
  );
}
