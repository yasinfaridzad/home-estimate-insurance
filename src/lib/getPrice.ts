export async function getPriceFromSerpApi(query: string): Promise<number | null> {
    try {
      const apiKey = process.env.SERPAPI_KEY
      const response = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}`)
      const data = await response.json()
  
      const results = data.shopping_results
      if (!results || results.length === 0) return null
  
      const priceText = results[0].price // z.B. "$249.99"
      const priceNumber = parseFloat(priceText.replace(/[^\d.]/g, ''))
  
      return isNaN(priceNumber) ? null : priceNumber
    } catch (err) {
      console.error('Preis abrufen fehlgeschlagen:', err)
      return null
    }
  }
  