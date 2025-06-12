import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getWeatherCondition, safeFetch } from '../utils/weather-utils';

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
  
  // 最初の3つの検索語を並列で試行し、その後は順次実行
  const primaryTerms = searchTerms.slice(0, 3);
  const fallbackTerms = searchTerms.slice(3);
  
  // 並列検索
  const primaryPromises = primaryTerms.map(async (searchTerm) => {
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTerm)}&count=1`;
    const geocodingResponse = await safeFetch(geocodingUrl);
    const data = (await geocodingResponse.json()) as GeocodingResponse;
    return { searchTerm, data };
  });
  
  try {
    const results = await Promise.all(primaryPromises);
    for (const { data } of results) {
      if (data.results?.[0]) {
        geocodingData = data;
        break;
      }
    }
  } catch (error) {
    // 並列検索でエラーが発生した場合は順次実行にフォールバック
    console.warn('並列検索でエラーが発生しました。順次検索に切り替えます:', error);
  }
  
  // 並列検索で見つからなかった場合、残りの検索語で順次実行
  if (!geocodingData) {
    for (const searchTerm of fallbackTerms) {
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTerm)}&count=1`;
      const geocodingResponse = await safeFetch(geocodingUrl);
      const data = (await geocodingResponse.json()) as GeocodingResponse;
      
      if (data.results?.[0]) {
        geocodingData = data;
        break;
      }
    }
  }

  if (!geocodingData?.results?.[0]) {
    throw new Error(`Location '${location}' not found after trying: ${searchTerms.join(', ')}`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;

  const response = await safeFetch(weatherUrl);
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
