import type { FoodItem, FoodNutritionPer100g } from '@/lib/types/food'

// v2 /search is tag-filter only; full-text search uses the legacy CGI endpoint.
const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'
const USER_AGENT = 'CholiApp - Web - Version 1.0 - Development'
const PAGE_SIZE = 10

interface OffNutriments {
  fat_100g?: number
  'saturated-fat_100g'?: number
  'energy-kcal_100g'?: number
  sugars_100g?: number
  fiber_100g?: number
  fat_serving?: number
  'saturated-fat_serving'?: number
  'energy-kcal_serving'?: number
  sugars_serving?: number
  fiber_serving?: number
}

interface OffProduct {
  code?: string
  product_name?: string
  brands?: string
  nutriments?: OffNutriments
  serving_quantity?: number | string
  product_quantity?: number | string
  product_quantity_unit?: string
}

interface OffSearchResponse {
  products?: OffProduct[]
}

function parseNumeric(value: number | string | undefined): number | null {
  if (value === undefined || value === null || value === '') return null
  const n = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

function parsePackWeightGrams(
  quantity: number | string | undefined,
  unit: string | undefined
): number | null {
  const n = parseNumeric(quantity)
  if (n === null) return null
  const u = (unit ?? 'g').toLowerCase()
  if (u === 'g' || u === 'gr' || u === 'gram' || u === 'grams') return n
  if (u === 'ml') return n
  return null
}

function parseOptionalNutrient(value: number | undefined): number | null {
  if (value === undefined || value === null || Number.isNaN(value)) return null
  return value >= 0 ? value : null
}

/** Parse per-100g fat values with a conservative saturated-fat fallback. */
export function parseOpenFoodFactsNutriments(
  nutriments: OffNutriments | undefined
): FoodNutritionPer100g {
  if (!nutriments) {
    return {
      fatPer100g: 0,
      satFatPer100g: 0,
      calsPer100g: 0,
      sugarsPer100g: null,
      fibrePer100g: null,
      hasNutrientData: false,
    }
  }

  const fat = nutriments.fat_100g
  const hasNutrientData = typeof fat === 'number' && !Number.isNaN(fat)

  let satFat = nutriments['saturated-fat_100g']
  if (hasNutrientData && (satFat === undefined || satFat === null || Number.isNaN(satFat))) {
    satFat = fat
  }

  const cals = nutriments['energy-kcal_100g']

  return {
    fatPer100g: hasNutrientData ? fat : 0,
    satFatPer100g: hasNutrientData ? (satFat ?? 0) : 0,
    calsPer100g: typeof cals === 'number' && !Number.isNaN(cals) ? cals : 0,
    sugarsPer100g: parseOptionalNutrient(nutriments.sugars_100g),
    fibrePer100g: parseOptionalNutrient(nutriments.fiber_100g),
    hasNutrientData,
  }
}

function parseServingFields(product: OffProduct) {
  const nutriments = product.nutriments
  const servingQuantityGrams = parseNumeric(product.serving_quantity)
  const packWeightGrams = parsePackWeightGrams(
    product.product_quantity,
    product.product_quantity_unit
  )

  const fatPerServing =
    typeof nutriments?.fat_serving === 'number' && !Number.isNaN(nutriments.fat_serving)
      ? nutriments.fat_serving
      : null

  let satFatPerServing =
    typeof nutriments?.['saturated-fat_serving'] === 'number' &&
    !Number.isNaN(nutriments['saturated-fat_serving'])
      ? nutriments['saturated-fat_serving']
      : null

  if (fatPerServing !== null && satFatPerServing === null) {
    satFatPerServing = fatPerServing
  }

  const calsPerServing =
    typeof nutriments?.['energy-kcal_serving'] === 'number' &&
    !Number.isNaN(nutriments['energy-kcal_serving'])
      ? nutriments['energy-kcal_serving']
      : null

  const sugarsPerServing =
    typeof nutriments?.sugars_serving === 'number' && !Number.isNaN(nutriments.sugars_serving)
      ? nutriments.sugars_serving
      : null

  const fibrePerServing =
    typeof nutriments?.fiber_serving === 'number' && !Number.isNaN(nutriments.fiber_serving)
      ? nutriments.fiber_serving
      : null

  return {
    servingQuantityGrams,
    packWeightGrams,
    fatPerServing,
    satFatPerServing,
    calsPerServing,
    sugarsPerServing,
    fibrePerServing,
  }
}

function formatProductName(product: OffProduct): string {
  const name = product.product_name?.trim() ?? 'Unknown product'
  const brand = product.brands?.trim()
  if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
    return `${brand} — ${name}`
  }
  return name
}

function productId(product: OffProduct, index: number): string {
  if (product.code) return product.code
  const brand = product.brands?.trim() ?? ''
  const name = product.product_name?.trim() ?? ''
  return `${brand}-${name}-${index}`.toLowerCase().replace(/\s+/g, '-')
}

function mapProduct(product: OffProduct, index: number): FoodItem {
  const nutrition = parseOpenFoodFactsNutriments(product.nutriments)
  const serving = parseServingFields(product)
  const defaultServing = serving.servingQuantityGrams ?? 100

  return {
    productCode: productId(product, index),
    name: formatProductName(product),
    brand: product.brands?.trim() ?? '',
    servingSize: defaultServing,
    servingSizeUnit: 'g',
    ...nutrition,
    ...serving,
  }
}

export class OpenFoodFactsError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'OpenFoodFactsError'
  }

  get isRateLimited(): boolean {
    return this.status === 429 || this.status === 503
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchOffSearch(url: string): Promise<Response> {
  const retryDelaysMs = [0, 800, 2000]
  let lastStatus = 0

  for (let attempt = 0; attempt < retryDelaysMs.length; attempt++) {
    if (retryDelaysMs[attempt] > 0) {
      await sleep(retryDelaysMs[attempt])
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      cache: 'no-store',
    })

    if (response.ok) {
      return response
    }

    lastStatus = response.status
    const retryable = response.status === 429 || response.status === 503 || response.status >= 500
    if (!retryable || attempt === retryDelaysMs.length - 1) {
      throw new OpenFoodFactsError(
        `Open Food Facts API responded with ${response.status}`,
        response.status
      )
    }
  }

  throw new OpenFoodFactsError(
    `Open Food Facts API responded with ${lastStatus}`,
    lastStatus
  )
}

export async function searchOpenFoodFacts(query: string): Promise<FoodItem[]> {
  const url = new URL(OFF_SEARCH_URL)
  url.searchParams.set('search_terms', query)
  url.searchParams.set('search_simple', '1')
  url.searchParams.set('action', 'process')
  url.searchParams.set('json', '1')
  url.searchParams.set('tagtype_0', 'countries')
  url.searchParams.set('tag_contains_0', 'contains')
  url.searchParams.set('tag_0', 'united-kingdom')
  url.searchParams.set(
    'fields',
    'code,product_name,brands,nutriments,serving_quantity,product_quantity,product_quantity_unit'
  )
  url.searchParams.set('page_size', String(PAGE_SIZE))

  const response = await fetchOffSearch(url.toString())

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new OpenFoodFactsError('Open Food Facts returned a non-JSON response', 503)
  }

  const data = (await response.json()) as OffSearchResponse
  const products = data.products ?? []

  return products
    .map(mapProduct)
    .filter((item) => item.name.length > 0)
    .sort((a, b) => {
      if (a.hasNutrientData !== b.hasNutrientData) {
        return a.hasNutrientData ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
}
