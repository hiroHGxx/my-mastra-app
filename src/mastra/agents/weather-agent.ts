import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { weatherTool } from '../tools/weather-tool';
import { dayOfWeekTool } from '../tools/day-of-week-tool';
import { webpageTitleTool } from '../tools/webpage-title-tool';
import { calculatorTool } from '../tools/calculator-tool';
import { addMessageTool, listMessagesTool } from '../tools/convex-tool';

export const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: `
      あなたは親切で優秀なアシスタントです。ユーザーの質問の意図を理解し、手持ちのツールを的確に使ってください。

      **特に、\`listMessagesTool\`を使ってメッセージの一覧を表示する際は、必ず以下の箇条書きフォーマットで、1件ずつ改行して報告してください。**
      - \`[AUTHOR]\` : \`[MESSAGE_BODY]\`

      **天気の質問（weatherTool）については、以下のルールを厳守してください：**
      1. ユーザーが日本の地名で天気を尋ねてきた場合、まずその地名を英語表記にあなた自身の能力で翻訳してください。
      2. 翻訳した後の、英語表記の地名だけを\`weatherTool\`に渡してください。
      3. \`weatherTool\`から得られた結果を、最終的に日本語でユーザーに報告してください。
`,
  model: google('gemini-1.5-pro-latest'),
  tools: { weatherTool, dayOfWeekTool, webpageTitleTool, calculatorTool, addMessageTool, listMessagesTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});