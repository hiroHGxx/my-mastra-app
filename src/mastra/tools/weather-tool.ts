import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}
interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

export const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string(),
  }),
  execute: async ({ context }) => {
    return await getWeather(context.location);
  },
});

const translateJapaneseLocation = (location: string): string => {
  const locationMap: Record<string, string> = {
    '東京': 'Tokyo',
    '大阪': 'Osaka', 
    '名古屋': 'Nagoya',
    '横浜': 'Yokohama',
    '京都': 'Kyoto',
    '神戸': 'Kobe',
    '札幌': 'Sapporo',
    '福岡': 'Fukuoka',
    '広島': 'Hiroshima',
    '仙台': 'Sendai',
    '千葉': 'Chiba',
    '北九州': 'Kitakyushu',
    '浜松': 'Hamamatsu',
    '新潟': 'Niigata',
    '熊本': 'Kumamoto',
    '相模原': 'Sagamihara',
    '岡山': 'Okayama',
    '金沢': 'Kanazawa',
    '長崎': 'Nagasaki',
    '奈良': 'Nara',
    '岐阜': 'Gifu',
  };
  
  return locationMap[location] || location;
};

const getWeather = async (location: string) => {
  // Try multiple search approaches for better success rate
  const translatedLocation = translateJapaneseLocation(location);
  const searchTerms = [
    translatedLocation, // Try translated name first
    location, // Try original name
    `${location}, Japan`, // Try with country suffix
    `${translatedLocation}, Japan`, // Try translated with country
    `${location}市`, // Try with city suffix (市)
    `${location}県`, // Try with prefecture suffix (県)
    `${translatedLocation}-shi` // Try with -shi suffix for cities
  ];
  
  let geocodingData: GeocodingResponse | null = null;
  
  for (const searchTerm of searchTerms) {
    
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTerm)}&count=1`;
    const geocodingResponse = await fetch(geocodingUrl);
    const data = (await geocodingResponse.json()) as GeocodingResponse;
    
    if (data.results?.[0]) {
      geocodingData = data;
      break;
    }
  }

  if (!geocodingData?.results?.[0]) {
    throw new Error(`Location '${location}' not found after trying: ${searchTerms.join(', ')}`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;

  const response = await fetch(weatherUrl);
  const data = (await response.json()) as WeatherResponse;

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name,
  };
};

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return conditions[code] || 'Unknown';
}
