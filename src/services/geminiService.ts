// Single clean implementation of sendChatMessage
const sendChatMessage = async (
  apiKey: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
) => {
  if (!apiKey) throw new Error('API key required for Gemini chat');

  // Use Gemini 2.0 Flash model
  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Add a concise instruction at the beginning
  const conciseInstruction = {
    role: 'user',
    parts: [
      {
        text: 'Give VERY SHORT, DIRECT answers. For pesticides: list names only. For why: 1 sentence only. For treatment: bullet points only. No extra text.',
      },
    ],
  };

  const contents = [
    conciseInstruction,
    ...messages.map(m => ({
      role: m.role === 'system' ? 'user' : m.role, // Gemini doesn't have system role, use user
      parts: [{ text: m.content }],
    })),
  ];

  const reqBody = {
    contents,
    generationConfig: {
      temperature: 0.05, // Even lower temperature for very focused responses
      maxOutputTokens: 150, // Much shorter responses
      topP: 0.7,
      topK: 30,
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '<no body>');
    throw new Error(`Gemini API error ${res.status}: ${txt}`);
  }

  const data = await res.json();

  // Handle Gemini 2.5 response format
  try {
    // Gemini 2.5 format: data.candidates[0].content.parts[0].text
    const candidate = data?.candidates?.[0];
    if (candidate?.content?.parts?.[0]?.text) {
      return candidate.content.parts[0].text;
    }

    // Fallback: try other common formats
    if (data?.candidates?.[0]?.content?.text) {
      return data.candidates[0].content.text;
    }

    // Fallback: return the stringified JSON so the app gets something instead of empty
    return JSON.stringify(data);
  } catch (e) {
    return JSON.stringify(data);
  }
};

export default { sendChatMessage };
