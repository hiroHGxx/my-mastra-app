/**
 * 天気関連のユーティリティ関数
 */

import { NetworkError, TimeoutError } from './errors';

/**
 * 天気コードを天気状態の説明に変換する
 * @param code 天気コード（Open-Meteo API準拠）
 * @returns 天気状態の説明文字列
 */
export function getWeatherCondition(code: number): string {
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

/**
 * HTTPリクエスト用のAbortControllerを作成（タイムアウト付き）
 * @param timeoutMs タイムアウト時間（ミリ秒）
 * @returns AbortController
 */
export function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

/**
 * 安全なfetch（タイムアウト付き）
 * @param url リクエストURL
 * @param options fetch オプション
 * @param timeoutMs タイムアウト時間（デフォルト: 10秒）
 * @returns Response
 */
export async function safeFetch(
  url: string, 
  options: RequestInit = {}, 
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = createTimeoutController(timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    if (!response.ok) {
      throw new NetworkError(
        `HTTP ${response.status}: ${response.statusText}`,
        'http-request',
        url
      );
    }
    
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(timeoutMs, 'http-request', url);
    }
    if (error instanceof NetworkError) {
      throw error;
    }
    throw new NetworkError(
      error instanceof Error ? error.message : '不明なネットワークエラー',
      'http-request',
      url,
      error instanceof Error ? error : undefined
    );
  }
}