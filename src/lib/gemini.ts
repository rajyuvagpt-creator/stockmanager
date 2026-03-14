import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  safetySettings,
})

export const geminiProModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  safetySettings,
})

export async function chatWithAI(
  systemPrompt: string,
  userMessage: string,
  history: { role: string; content: string }[] = []
): Promise<string> {
  const chat = geminiModel.startChat({
    history: history.map((h) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    })),
    systemInstruction: systemPrompt,
  })

  const result = await chat.sendMessage(userMessage)
  return result.response.text()
}

export async function generateForecast(prompt: string): Promise<string> {
  const result = await geminiProModel.generateContent(prompt)
  return result.response.text()
}

export async function analyzeProductImage(imageBase64: string, mimeType: string): Promise<string> {
  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType,
    },
  }

  const prompt = `Analyze this product image and extract:
1. Product name
2. Brand (if visible)
3. Category
4. Barcode/QR code number (if visible)
5. Net weight/quantity
6. Any price information

Respond in JSON format.`

  const result = await geminiProModel.generateContent([prompt, imagePart])
  return result.response.text()
}
