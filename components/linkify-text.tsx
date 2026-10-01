const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const TRAILING_PUNCTUATION = /[.,;:!?)'"]+$/;

function splitTrailingPunctuation(url: string): [string, string] {
  const match = url.match(TRAILING_PUNCTUATION);
  if (!match) return [url, ""];
  return [url.slice(0, -match[0].length), match[0]];
}

/** Renders plain text with any http(s) URLs turned into real links. */
export function LinkifyText({ text }: { text: string }) {
  const parts = text.split(URL_PATTERN);

  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        const [url, trailing] = splitTrailingPunctuation(part);
        return (
          <span key={i}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:no-underline"
            >
              {url}
              <span className="sr-only"> (opens in new tab)</span>
            </a>
            {trailing}
          </span>
        );
      })}
    </>
  );
}
