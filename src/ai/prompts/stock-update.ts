export const STOCK_UPDATE_PROMPT = `Parse the following voice/text input from an Indian shopkeeper and extract stock update information.

The input may be in Hindi, English, or Hinglish.

## Common patterns:
- "Add 50 kg chawal" → add 50 of rice
- "Daal khatam ho gaya" → set quantity to 0 for lentils
- "Bread 20 pieces aaye" → add 20 of bread
- "Aaj 10 liter tel bika" → subtract 10 of oil (sold)
- "Tomato 5 kg set karo" → set 5 of tomatoes

## Response Format (JSON):
{
  "action": "add" | "subtract" | "set",
  "products": [
    {
      "productName": "product name in English",
      "quantity": 0,
      "unit": "kg|liter|piece|dozen|pack",
      "reason": "restocked|sold|damaged|expired|adjustment"
    }
  ],
  "confidence": 0.95,
  "originalText": "original input"
}

If the input is unclear, set confidence below 0.7 and ask for clarification in the "clarification" field.

Respond ONLY with valid JSON.`
