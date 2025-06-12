import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { safeFetch } from '../utils/weather-utils';

export const webpageTitleTool = createTool({
  id: 'get-webpage-title',
  description: '指定されたURLのWebページのタイトルを取得します。',
  inputSchema: z.object({
    url: z.string().describe('タイトルを取得したいWebページのURL'),
  }),
  outputSchema: z.object({
    title: z.string(),
    url: z.string(),
  }),
  execute: async ({ context }) => {
    return await getWebpageTitle(context.url);
  },
});

const getWebpageTitle = async (url: string) => {
  try {
    // URLの形式を検証
    const urlObj = new URL(url);
    
    // HTMLコンテンツを取得
    const response = await safeFetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebpageTitleTool/1.0)',
      },
    }, 15000); // Webページ取得のため15秒タイムアウト
    
    const html = await response.text();
    
    // titleタグを抽出
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    
    if (!titleMatch || !titleMatch[1]) {
      throw new Error('ページにタイトルタグが見つかりませんでした');
    }
    
    // HTMLエンティティをデコードし、余分な空白を削除
    const title = titleMatch[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    return {
      title,
      url,
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
      throw new Error(`無効なURL形式です: ${url}`);
    }
    
    if (error instanceof Error) {
      throw new Error(`Webページタイトルの取得に失敗しました: ${error.message}`);
    }
    
    throw new Error('Webページタイトルの取得中に予期しないエラーが発生しました');
  }
};