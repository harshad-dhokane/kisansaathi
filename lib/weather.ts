const GEOCODING_API_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_API_URL = "https://api.open-meteo.com/v1/forecast";
const REVERSE_GEOCODING_API_URL = "https://nominatim.openstreetmap.org/reverse";
const DEFAULT_LOCALE = "en-IN";
const DEFAULT_TIMEZONE = "UTC";

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "clear sky",
  1: "mostly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "rime fog",
  51: "light drizzle",
  53: "drizzle",
  55: "dense drizzle",
  56: "light freezing drizzle",
  57: "freezing drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  66: "light freezing rain",
  67: "freezing rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  77: "snow grains",
  80: "light rain showers",
  81: "rain showers",
  82: "violent rain showers",
  85: "light snow showers",
  86: "snow showers",
  95: "thunderstorm",
  96: "thunderstorm with hail",
  99: "severe thunderstorm with hail",
};

type GeocodingApiResponse = {
  results?: Array<{
    name?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    country?: string;
    admin1?: string;
  }>;
};

type ForecastApiResponse = {
  timezone?: string;
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    is_day?: number;
  };
};

type ReverseGeocodingResponse = {
  address?: {
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state_district?: string;
    state?: string;
    country?: string;
  };
};

type ResolvedLocation = {
  label: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

export type RealtimeContextInput = {
  locationQuery?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  locale?: string;
};

export type RealtimeContextSnapshot = {
  locale: string;
  timezone: string;
  weekday: string;
  date: string;
  time: string;
  locationLabel?: string;
  weatherSummary?: string;
};

function parseFiniteNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
}

function isValidLatitude(value: number | undefined) {
  return typeof value === "number" && value >= -90 && value <= 90;
}

function isValidLongitude(value: number | undefined) {
  return typeof value === "number" && value >= -180 && value <= 180;
}

function sanitizeContextInput(input: unknown): RealtimeContextInput {
  if (!input || typeof input !== "object") {
    return {};
  }

  const candidate = input as Record<string, unknown>;
  const locationQuery =
    typeof candidate.locationQuery === "string" ? candidate.locationQuery.trim().slice(0, 120) : "";
  const timezone =
    typeof candidate.timezone === "string" ? candidate.timezone.trim().slice(0, 80) : "";
  const locale = typeof candidate.locale === "string" ? candidate.locale.trim().slice(0, 35) : "";
  const latitude = parseFiniteNumber(candidate.latitude);
  const longitude = parseFiniteNumber(candidate.longitude);

  return {
    locationQuery: locationQuery || undefined,
    timezone: timezone || undefined,
    locale: locale || undefined,
    latitude: isValidLatitude(latitude) ? latitude : undefined,
    longitude: isValidLongitude(longitude) ? longitude : undefined,
  };
}

function resolveLocale(locale: string | undefined) {
  if (!locale) {
    return DEFAULT_LOCALE;
  }

  try {
    new Intl.DateTimeFormat(locale).format(new Date());
    return locale;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function resolveTimezone(timezone: string | undefined) {
  if (!timezone) {
    return undefined;
  }

  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return undefined;
  }
}

function formatLocationLabel(parts: Array<string | undefined>) {
  const seen = new Set<string>();
  const unique = parts.filter((part): part is string => {
    if (!part) {
      return false;
    }

    const value = part.trim();
    if (!value) {
      return false;
    }

    const key = value.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return unique.join(", ");
}

function formatLocalNow(locale: string, timezone: string) {
  const now = new Date();

  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: timezone,
  }).format(now);
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(now);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(now);

  return { weekday, date, time };
}

function formatWeatherCode(code: number | undefined, isDay: number | undefined) {
  if (typeof code !== "number") {
    return undefined;
  }

  const label = WEATHER_CODE_LABELS[code];
  if (!label) {
    return undefined;
  }

  if (code === 0 && isDay === 0) {
    return "clear night";
  }

  return label;
}

function formatWeatherSummary(locationLabel: string, weather: ForecastApiResponse["current"]) {
  if (!weather) {
    return undefined;
  }

  const parts: string[] = [];

  if (typeof weather.temperature_2m === "number") {
    parts.push(`${Math.round(weather.temperature_2m)}°C`);
  }

  const sky = formatWeatherCode(weather.weather_code, weather.is_day);
  if (sky) {
    parts.push(sky);
  }

  if (typeof weather.apparent_temperature === "number") {
    parts.push(`feels like ${Math.round(weather.apparent_temperature)}°C`);
  }

  if (typeof weather.relative_humidity_2m === "number") {
    parts.push(`humidity ${Math.round(weather.relative_humidity_2m)}%`);
  }

  if (typeof weather.wind_speed_10m === "number") {
    parts.push(`wind ${Math.round(weather.wind_speed_10m)} km/h`);
  }

  if (typeof weather.precipitation === "number" && weather.precipitation > 0) {
    parts.push(`recent precipitation ${weather.precipitation.toFixed(1)} mm`);
  }

  if (parts.length === 0) {
    return undefined;
  }

  return `Near ${locationLabel}: ${parts.join(", ")}.`;
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(`Upstream request failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as T;
}

async function geocodeLocation(query: string, locale: string): Promise<ResolvedLocation | null> {
  const language = locale.split("-")[0]?.toLowerCase() || "en";
  const url = new URL(GEOCODING_API_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", language);

  const data = await fetchJson<GeocodingApiResponse>(url.toString());
  const match = data.results?.[0];

  if (
    !match ||
    !isValidLatitude(match.latitude) ||
    !isValidLongitude(match.longitude)
  ) {
    return null;
  }

  const latitude = match.latitude!;
  const longitude = match.longitude!;

  return {
    label:
      formatLocationLabel([match.name, match.admin1, match.country]) || query,
    latitude,
    longitude,
    timezone: resolveTimezone(match.timezone),
  };
}

async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
  locale: string,
): Promise<string | undefined> {
  const language = locale.split("-")[0]?.toLowerCase() || "en";
  const url = new URL(REVERSE_GEOCODING_API_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("accept-language", language);
  url.searchParams.set("zoom", "10");

  const response = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
    headers: {
      "User-Agent": "AgriSmart/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as ReverseGeocodingResponse;

  return (
    formatLocationLabel([
      data.address?.village || data.address?.town || data.address?.city,
      data.address?.county || data.address?.state_district || data.address?.state,
      data.address?.country,
    ]) || undefined
  );
}

async function resolveLocationContext(
  context: RealtimeContextInput,
  locale: string,
): Promise<ResolvedLocation | null> {
  if (context.locationQuery) {
    try {
      const resolved = await geocodeLocation(context.locationQuery, locale);
      if (resolved) {
        return resolved;
      }
    } catch (error) {
      console.error("Location search failed.", error);
    }
  }

  if (isValidLatitude(context.latitude) && isValidLongitude(context.longitude)) {
    const latitude = context.latitude!;
    const longitude = context.longitude!;
    let label = context.locationQuery;

    try {
      label = (await reverseGeocodeLocation(latitude, longitude, locale)) || label;
    } catch (error) {
      console.error("Reverse geocoding failed.", error);
    }

    return {
      label: label || "Current area",
      latitude,
      longitude,
      timezone: resolveTimezone(context.timezone),
    };
  }

  return null;
}

async function getWeatherSummary(location: ResolvedLocation) {
  const url = new URL(FORECAST_API_URL);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "is_day",
    ].join(","),
  );
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", location.timezone || "auto");
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("precipitation_unit", "mm");

  const data = await fetchJson<ForecastApiResponse>(url.toString());

  return {
    timezone: resolveTimezone(data.timezone) || location.timezone,
    summary: formatWeatherSummary(location.label, data.current),
  };
}

export async function getRealtimeContextSnapshot(
  input: unknown,
): Promise<RealtimeContextSnapshot> {
  const context = sanitizeContextInput(input);
  const locale = resolveLocale(context.locale);
  const fallbackTimezone = resolveTimezone(context.timezone) || DEFAULT_TIMEZONE;
  const resolvedLocation = await resolveLocationContext(context, locale);
  const locationLabel = resolvedLocation?.label || context.locationQuery;

  let timezone = resolvedLocation?.timezone || fallbackTimezone;
  let weatherSummary: string | undefined;

  if (resolvedLocation) {
    try {
      const weather = await getWeatherSummary(resolvedLocation);
      timezone = weather.timezone || timezone;
      weatherSummary = weather.summary;
    } catch (error) {
      console.error("Weather lookup failed.", error);
    }
  }

  const now = formatLocalNow(locale, timezone);
  return {
    locale,
    timezone,
    weekday: now.weekday,
    date: now.date,
    time: now.time,
    locationLabel,
    weatherSummary,
  };
}

export async function buildRealtimeContextMessage(input: unknown) {
  const snapshot = await getRealtimeContextSnapshot(input);
  const lines = [
    "Verified real-time context for this reply:",
    `- Local day and date: ${snapshot.weekday}, ${snapshot.date}`,
    `- Local time: ${snapshot.time}`,
  ];

  if (snapshot.locationLabel) {
    lines.push(`- Location: ${snapshot.locationLabel}`);
  }

  if (snapshot.weatherSummary) {
    lines.push(`- Current weather: ${snapshot.weatherSummary}`);
  }

  lines.push(
    "- Use this context only if it helps the farmer. If the user names a different place or time, follow the user's message instead.",
  );
  lines.push(
    "- Treat weather as nearby area conditions from a weather model, not as exact field-level measurements.",
  );

  return lines.join("\n");
}
