import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const dayOfWeekTool = createTool({
  id: 'get-day-of-week',
  description: '今日の曜日を日本語で答えます。',
  inputSchema: z.object({}),
  outputSchema: z.object({
    dayOfWeek: z.string(),
  }),
  execute: async () => {
    return await getDayOfWeek();
  },
});

const getDayOfWeek = async () => {
  const today = new Date();
  const dayIndex = today.getDay();
  
  const daysInJapanese = [
    '日曜日',
    '月曜日',
    '火曜日',
    '水曜日',
    '木曜日',
    '金曜日',
    '土曜日'
  ];
  
  return {
    dayOfWeek: daysInJapanese[dayIndex],
  };
};