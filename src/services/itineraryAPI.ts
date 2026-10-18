
export type ItineraryRequest = {
  destination: string
  country: string
  startDate: string
  endDate: string
  budget: number
}

export type BudgetBreakdown = {
  accommodation: number
  food: number
  transport: number
  activities: number
  miscellaneous: number
}

export type ItineraryDay = {
  day: number
  date: string
  title: string
  morning: string
  afternoon: string
  evening: string
  transport: string
  estimatedCostSGD: number
}

export type StructuredItinerary = {
  introduction: string
  budgetBreakdown: BudgetBreakdown
  days: ItineraryDay[]
  travelTips: string[]
}

export type ItineraryResponse = {
  itinerary: StructuredItinerary
}

export async function generateItinerary(
  trip: ItineraryRequest
): Promise<StructuredItinerary> {
  const response = await fetch('/api/itinerary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(trip),
  })

  if (!response.ok) {
    let message = 'Unable to generate itinerary.'

    try {
      const data = await response.json()
      if (typeof data.error === 'string') {
        message = data.error
      }
    } catch {
      // Use the default error message.
    }

    throw new Error(message)
  }

  const data: ItineraryResponse = await response.json()

  if (
    !data.itinerary ||
    !Array.isArray(data.itinerary.days) ||
    !Array.isArray(data.itinerary.travelTips)
  ) {
    throw new Error('Gemini returned an invalid itinerary.')
  }

  return data.itinerary
}
