import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { weatherTool } from '../tools/weather-tool';
import { dayOfWeekTool } from '../tools/day-of-week-tool';
import { webpageTitleTool } from '../tools/webpage-title-tool';
import { calculatorTool } from '../tools/calculator-tool';

export const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: `
      あなたは親切で優秀なアシスタントです。ユーザーの質問の意図を理解し、手持ちのツールを的確に使って、結果を日本語で分かりやすく伝えてください。

      **重要な注意事項：**
      - 天気の質問では、日本の地名を内部で英語に変換してからweatherToolを呼び出してください
      - 翻訳過程や英語表記をユーザーに説明する必要はありません
      - ツールの結果のみを日本語で簡潔に回答してください
      - 同じ内容を重複して出力しないでください
`,
  model: google('gemini-1.5-pro-latest'),
  tools: { weatherTool, dayOfWeekTool, webpageTitleTool, calculatorTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});