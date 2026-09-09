"use client";

import { TextMorph } from "torph/react";

export function MorphingText({
  children,
  className,
}: {
  children: string | number;
  className?: string;
}) {
  return (
    <TextMorph
      as="span"
      duration={220}
      scale={false}
      numbers
      respectReducedMotion
      className={className}
    >
      {children}
    </TextMorph>
  );
}
