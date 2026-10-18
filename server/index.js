
import 'dotenv/config'
import express from 'express'
import { GoogleGenAI } from '@google/genai'

const app = express()
const PORT = 3001

app.use(express.json({ limit: '20kb' }))

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

// A separate backend protects our Gemini API key from
// being exposed in the browser or frontend source code.
app.post('/api/itinerary', async (req, res) => {
  try {
    const { destination, country, startDate, endDate, budget } = req.body

    // Validate user input before calling an external API.
    if (
      typeof destination !== 'string' ||
      typeof country !== 'string' ||
      typeof startDate !== 'string' ||
      typeof endDate !== 'string' ||
      typeof budget !== 'number' ||
      !Number.isFinite(budget) ||
      budget <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
      endDate < startDate ||
      destination.length > 100 ||
      country.length > 100
    ) {
      return res.status(400).json({
        error: 'Invalid trip details.',
      })
    }

    const days =
      Math.round(
        (Date.parse(endDate) - Date.parse(startDate)) / 86400000
      ) + 1

    if (!Number.isInteger(days) || days < 1 || days > 21) {
      return res.status(400).json({
        error: 'Itinerary must be between 1 and 21 days.',
      })
    }

    
const response = await ai.models.generateContent({
  model: 'gemini-3.5-flash-lite',

  contents: `
    Create a realistic ${days}-day travel itinerary.

    Destination: ${destination}, ${country}
    Start date: ${startDate}
    End date: ${endDate}
    Total budget: SGD ${budget}

    Generate exactly ${days} days, in chronological order.

    For each day, include:
    - A descriptive title
    - Morning, afternoon and evening activities
    - Suggested transport
    - Estimated daily spending in SGD

    Also provide:
    - A short trip introduction
    - A budget breakdown in SGD
    - Practical travel tips

    Keep the total estimated budget within SGD ${budget}
    where reasonably possible.

    Treat prices and opening hours as estimates, not verified facts.
  `,

  // Structured output ensures the frontend receives predictable
  // fields instead of trying to parse arbitrary AI-generated text.
  config: {
    responseMimeType: 'application/json',

    responseJsonSchema: {
      type: 'object',
      properties: {
        introduction: {
          type: 'string',
        },
        budgetBreakdown: {
          type: 'object',
          properties: {
            accommodation: { type: 'number' },
            food: { type: 'number' },
            transport: { type: 'number' },
            activities: { type: 'number' },
            miscellaneous: { type: 'number' },
          },
          required: [
            'accommodation',
            'food',
            'transport',
            'activities',
            'miscellaneous',
          ],
          additionalProperties: false,
        },
        days: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'integer' },
              date: { type: 'string' },
              title: { type: 'string' },
              morning: { type: 'string' },
              afternoon: { type: 'string' },
              evening: { type: 'string' },
              transport: { type: 'string' },
              estimatedCostSGD: { type: 'number' },
            },
            required: [
              'day',
              'date',
              'title',
              'morning',
              'afternoon',
              'evening',
              'transport',
              'estimatedCostSGD',
            ],
            additionalProperties: false,
          },
        },
        travelTips: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: [
        'introduction',
        'budgetBreakdown',
        'days',
        'travelTips',
      ],
      additionalProperties: false,
    },
  },
})


    
const itinerary = JSON.parse(response.text ?? 'null')

// Validate the number and sequence of days before saving.
// The JSON schema checks the shape, but our app must also
// verify that the response matches the requested travel dates.
if (
  !itinerary ||
  !Array.isArray(itinerary.days) ||
  itinerary.days.length !== days ||
  itinerary.days.some((day, index) => {
    const expectedDate = new Date(
      Date.parse(startDate + 'T00:00:00Z') +
      index * 86400000
    ).toISOString().slice(0, 10)

    return (
      day.day !== index + 1 ||
      day.date !== expectedDate
    )
  })
) {
  return res.status(502).json({
    error: 'Gemini returned an invalid itinerary.',
  })
}

res.json({ itinerary })

  } catch (error) {
    console.error('Gemini generation failed:', error)

    res.status(502).json({
      error: 'Unable to generate itinerary. Please try again later.',
    })
  }
})

app.listen(PORT, () => {
  console.log(`Gemini backend running on http://localhost:${PORT}`)
})
