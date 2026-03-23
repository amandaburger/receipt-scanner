export const config = {
  api: { bodyParser: { sizeLimit: '15mb' } },
};

export default async function handler(req, res) {
  // CORS — allow requests from Expo Go / simulators
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { imageBase64 } = req.body;

  if (!imageBase64 || imageBase64.length > 14_000_000) {
    return res.status(413).json({ error: 'image_too_large' });
  }

  if (!process.env.GOOGLE_VISION_API_KEY) {
    return res.status(500).json({ error: 'no_api_key' });
  }

  let visionRes;
  try {
    visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [{ type: 'TEXT_DETECTION' }],
          }],
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );
  } catch (err) {
    return res.status(408).json({ error: 'timeout' });
  }

  if (visionRes.status === 429) return res.status(429).json({ error: 'quota' });
  if (!visionRes.ok) return res.status(502).json({ error: 'vision_error' });

  const data = await visionRes.json();
  const annotations = data.responses?.[0]?.textAnnotations;

  if (!annotations || annotations.length === 0) {
    return res.status(422).json({ error: 'no_text' });
  }

  const fullText = annotations[0].description;
  const words = annotations.slice(1).map(w => ({
    text: w.description,
    confidence: w.confidence ?? 1,
  }));

  res.json({ text: fullText, words });
}
