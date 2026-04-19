/**
 * Utility for generating clues using free AI (Groq API)
 * Get a free API key at: https://console.groq.com
 */

const FALLBACK_DEFINITIONS: { [key: string]: string } = {
  'אוזן': 'איבר בגוף שאחראי על שמיעה',
  'עין': 'איבר בגוף שאחראי על ראייה',
  'בית': 'מקום מגורים',
};

export interface ClueGeneratorResult {
  word: string;
  clue: string;
  source: 'ai' | 'local' | 'none';
}

export const generateClueForWord = async (word: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

  console.log('🔍 generateClueForWord called with word:', `"${word}"`);
  console.log('🔍 API key exists:', !!apiKey);

  if (!apiKey) {
    console.warn('❌ No Groq API key found in import.meta.env.VITE_GROQ_API_KEY');
    if (FALLBACK_DEFINITIONS[word.trim()]) {
      return FALLBACK_DEFINITIONS[word.trim()];
    }
    return `מילה בעברית`;
  }

  try {
    console.log('🚀 Making API call to Groq for word:', word);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'אתה עוזר שמספק הגדרות קצרות וברורות למילים בעברית. הגדרה צריכה להיות משפט אחד בלבד, עד 15 מילים.',
          },
          {
            role: 'user',
            content: `תן הגדרה קצרה למילה: "${word}"`,
          },
        ],
        max_tokens: 100,
      }),
    });

    console.log('📡 API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq API error:', response.status, errorText);
      if (FALLBACK_DEFINITIONS[word.trim()]) {
        return FALLBACK_DEFINITIONS[word.trim()];
      }
      return `מילה בעברית`;
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    console.log('📦 API response data:', data);

    const clue = data.choices[0]?.message?.content?.trim();
    console.log('✅ Generated clue:', `"${clue}"`);

    return clue || `מילה בעברית`;
  } catch (error) {
    console.error('💥 Error calling Groq API:', error);
    // Fallback to local definition
    if (FALLBACK_DEFINITIONS[word.trim()]) {
      return FALLBACK_DEFINITIONS[word.trim()];
    }
    return `מילה בעברית`;
  }
};

export const generateCluesForGrid = async (
  words: { across: string[]; down: string[] }
): Promise<{ [key: string]: string }> => {
  const clues: { [key: string]: string } = {};

  // Generate clues for across words (parallel)
  const acrossClues = await Promise.all(
    words.across.map((word) => generateClueForWord(word))
  );
  words.across.forEach((word, index) => {
    clues[`across-${index}`] = acrossClues[index];
  });

  // Generate clues for down words (parallel)
  const downClues = await Promise.all(
    words.down.map((word) => generateClueForWord(word))
  );
  words.down.forEach((word, index) => {
    clues[`down-${index}`] = downClues[index];
  });

  return clues;
};
