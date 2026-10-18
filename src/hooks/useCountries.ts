
import { useEffect, useState } from 'react'

export type Country = {
  name: string
  code: string
  flag: string
}

type ApiCountry = {
  name: { common: string }
  cca2: string
  flags: { png: string }
}

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    fetch(
      'https://restcountries.com/v3.1/all?fields=name,cca2,flags',
      { signal: controller.signal }
    )
      .then(response => {
        if (!response.ok) throw new Error('Country API unavailable')
        return response.json() as Promise<ApiCountry[]>
      })
      .then(data => {
        setCountries(
          data
            .map(country => ({
              name: country.name.common,
              code: country.cca2.toLowerCase(),
              flag: country.flags.png,
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
        )
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { countries, loading, error }
}
