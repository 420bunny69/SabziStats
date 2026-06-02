export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set' })
  }

  try {
    const incoming = req.body.messages?.[0]?.content || []

    const parts = incoming.map(part => {
      if (part.type === 'text') {
        return { text: part.text }
      }
      if (part.type === 'image') {
        return { inlineData: { mimeType: part.source.media_type, data: part.source.data } }
      }
      return null
    }).filter(Boolean)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API error' })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const meal = JSON.parse(clean)
    return res.status(200).json(meal)
  } catch (err) {
    console.error('log-meal error:', err)
    return res.status(500).json({ error: 'Failed to analyse meal' })
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
}
