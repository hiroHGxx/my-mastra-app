import { createTool } from '@mastra/core/tools';
import { ConvexHttpClient } from 'convex/browser';
import { z } from 'zod';

const convexClient = new ConvexHttpClient(process.env.CONVEX_URL!);

export const addMessageTool = createTool({
  id: 'add-message',
  description: 'Convexデータベースの\'messages\'テーブルに、新しいメッセージを書き込みます。',
  inputSchema: z.object({
    author: z.string().describe('メッセージの作成者'),
    body: z.string().describe('メッセージの内容'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    messageId: z.string().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const messageId = await convexClient.mutation('messages:send', {
        author: context.author,
        body: context.body,
      });
      
      return {
        success: true,
        messageId: messageId as string,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`メッセージの送信に失敗しました: ${error.message}`);
      }
      
      throw new Error('メッセージの送信中に予期しないエラーが発生しました');
    }
  },
});

export const listMessagesTool = createTool({
  id: 'list-messages',
  description: 'Convexデータベースの\'messages\'テーブルにある全てのメッセージを取得します。',
  inputSchema: z.object({}),
  outputSchema: z.object({
    messages: z.array(z.object({
      _id: z.string(),
      author: z.string(),
      body: z.string(),
      _creationTime: z.number(),
    })),
  }),
  execute: async () => {
    try {
      const messages = await convexClient.query('messages:list');
      
      return {
        messages: messages as Array<{
          _id: string;
          author: string;
          body: string;
          _creationTime: number;
        }>,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`メッセージの取得に失敗しました: ${error.message}`);
      }
      
      throw new Error('メッセージの取得中に予期しないエラーが発生しました');
    }
  },
});