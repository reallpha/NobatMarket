/**
 * JsonLd — Renders a <script type="application/ld+json"> tag.
 *
 * Usage:
 *   <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", ... }} />
 *   <JsonLd graph={[{ ...webSite }, { ...organization }]} />
 */

type JsonLdData = Record<string, unknown>;

interface JsonLdProps {
  /** Single schema object */
  data?: JsonLdData;
  /** Array of schemas rendered as @graph (mutually exclusive with data) */
  graph?: JsonLdData[];
}

export default function JsonLd({ data, graph }: JsonLdProps) {
  let payload: JsonLdData;

  if (graph && graph.length > 0) {
    payload = {
      "@context": "https://schema.org",
      "@graph": graph,
    };
  } else if (data) {
    payload = data;
  } else {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
