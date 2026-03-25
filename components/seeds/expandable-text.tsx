"use client";

import { useState } from "react";

export function ExpandableText({
  text,
  maxChars = 800,
}: {
  text: string;
  maxChars?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const needsTruncation = text.length > maxChars;

  if (!needsTruncation || isExpanded) {
    return <div className="whitespace-pre-wrap">{text}</div>;
  }

  // Truncate at a paragraph or sentence boundary near maxChars
  let truncateAt = text.lastIndexOf("\n\n", maxChars);
  if (truncateAt < maxChars * 0.5) {
    truncateAt = text.lastIndexOf(". ", maxChars);
    if (truncateAt > 0) truncateAt += 1; // include the period
  }
  if (truncateAt < maxChars * 0.5) {
    truncateAt = maxChars;
  }

  return (
    <div>
      <div className="whitespace-pre-wrap">{text.slice(0, truncateAt)}...</div>
      <button
        onClick={() => setIsExpanded(true)}
        className="text-primary mt-2 text-sm font-medium"
      >
        See more
      </button>
    </div>
  );
}
