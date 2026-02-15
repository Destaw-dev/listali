import React from "react";

type Props = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

export function ListaliIcon({ title = "Listali icon", className, ...props }: Props) {
  // id ייחודי כדי שלא יהיו התנגשויות אם תשתמש באייקון כמה פעמים בעמוד
  const titleId = React.useId();

  return (
    <svg
      viewBox="0 0 1024 1024"
      role="img"
      aria-labelledby={title ? titleId : undefined}
      className={className}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}

      <rect width="1024" height="1024" rx="220" fill="#0742a2" />

      <path
        fill="#fff"
        d="
          M 320 260
          Q 320 220 360 220
          H 460
          Q 500 220 500 260
          V 650
          Q 500 690 540 690
          H 740
          Q 780 690 780 730
          V 820
          Q 780 860 740 860
          H 360
          Q 320 860 320 820
          Z
        "
      />

      <path
        d="M 600 540 L 690 630 L 840 470"
        fill="none"
        stroke="#ffffff"
        strokeWidth="92"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
