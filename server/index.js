import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import express from 'express'
import { GoogleGenAI } from '@google/genai'

//set up the Express server and port
const app = express()
const PORT = process.env.PORT || 3001

//Allow server to receive JSON data from the frontend 
app.use(express.json({ limit: '20kb' }))

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})


//Handle itinerary requests from the frontend without exposing API key
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

//send the trip details to gemini to generate a daily itinerary 
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

  //Ask gemini to return JSON so the frontend can display the itinerary 
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


// Convert JSON response into an object 
const itinerary = JSON.parse(response.text ?? 'null')


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

//Return error message if itinerary generation fails 
res.json({ itinerary })

  } catch (error) {
    console.error('Gemini generation failed:', error)

    res.status(502).json({
      error: 'Unable to generate itinerary. Please try again later.',
    })
  }
})


//Locate the built React files so Express can serve the website
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')

app.use(express.static(distPath))

// React Router / SPA fallback for non-API page requests.
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Compass running on port ${PORT}`)
})
