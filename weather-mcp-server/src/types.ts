// ─── Tipos para la API de Geocoding ────────────────────────────────

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone: string;
  country: string;
  country_code: string;
  admin1?: string;       // Region / Comunidad Autonoma
  admin2?: string;       // Provincia
  population?: number;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
  generationtime_ms: number;
}

// ─── Tipos para la API de Forecast ─────────────────────────────────

export interface CurrentWeather {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  precipitation: number;
  cloud_cover: number;
  is_day: number;
}

export interface DailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  wind_speed_10m_max: number[];
  sunrise: string[];
  sunset: string[];
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current?: CurrentWeather;
  current_units?: Record<string, string>;
  daily?: DailyForecast;
  daily_units?: Record<string, string>;
  generationtime_ms: number;
}