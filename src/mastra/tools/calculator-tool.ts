import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const calculatorTool = createTool({
  id: 'calculate-expression',
  description: '簡単な数式の計算を実行します。例: \'100 + 200\'',
  inputSchema: z.object({
    expression: z.string().describe('計算したい数式（例: "123 * 45"）'),
  }),
  outputSchema: z.object({
    expression: z.string(),
    result: z.number(),
    formatted: z.string(),
  }),
  execute: async ({ context }) => {
    return await calculateExpression(context.expression);
  },
});

const calculateExpression = async (expression: string) => {
  try {
    // 入力文字列をクリーンアップ
    const cleanExpression = expression.trim().replace(/\s+/g, ' ');
    
    // 安全な数式解析を実行
    const result = parseAndCalculate(cleanExpression);
    
    return {
      expression: cleanExpression,
      result,
      formatted: `${cleanExpression} = ${result}`,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`数式の計算に失敗しました: ${error.message}`);
    }
    
    throw new Error('数式の計算中に予期しないエラーが発生しました');
  }
};

// 安全な数式パーサー（eval を使わない）
const parseAndCalculate = (expression: string): number => {
  // 許可された文字のみをチェック（数字、演算子、スペース、小数点、括弧）
  const allowedChars = /^[0-9+\-*/().\s]+$/;
  if (!allowedChars.test(expression)) {
    throw new Error('無効な文字が含まれています。数字と演算子（+, -, *, /）、括弧のみ使用できます');
  }
  
  // 括弧を含む式の処理
  while (expression.includes('(')) {
    const match = expression.match(/\([^()]+\)/);
    if (!match) {
      throw new Error('括弧の対応が正しくありません');
    }
    
    const innerExpression = match[0].slice(1, -1); // 括弧を除去
    const innerResult = calculateSimpleExpression(innerExpression);
    expression = expression.replace(match[0], innerResult.toString());
  }
  
  return calculateSimpleExpression(expression);
};

// 括弧のない簡単な式を計算
const calculateSimpleExpression = (expression: string): number => {
  // トークンに分割
  const tokens = tokenize(expression);
  
  if (tokens.length === 0) {
    throw new Error('空の数式です');
  }
  
  // 掛け算と割り算を先に処理
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i] === '*' || tokens[i] === '/') {
      if (i === 0 || i === tokens.length - 1) {
        throw new Error(`演算子 '${tokens[i]}' の位置が不正です`);
      }
      
      const left = parseFloat(tokens[i - 1]);
      const right = parseFloat(tokens[i + 1]);
      
      if (isNaN(left) || isNaN(right)) {
        throw new Error('無効な数値が含まれています');
      }
      
      let result: number;
      if (tokens[i] === '*') {
        result = left * right;
      } else {
        if (right === 0) {
          throw new Error('ゼロで割ることはできません');
        }
        result = left / right;
      }
      
      // 結果で置き換え
      tokens.splice(i - 1, 3, result.toString());
      i = Math.max(0, i - 1);
    } else {
      i++;
    }
  }
  
  // 足し算と引き算を処理
  i = 0;
  while (i < tokens.length) {
    if (tokens[i] === '+' || tokens[i] === '-') {
      if (i === 0) {
        // 単項マイナスの処理
        if (tokens[i] === '-' && tokens.length > 1) {
          const right = parseFloat(tokens[i + 1]);
          if (isNaN(right)) {
            throw new Error('無効な数値が含まれています');
          }
          tokens.splice(i, 2, (-right).toString());
          continue;
        } else {
          throw new Error(`演算子 '${tokens[i]}' の位置が不正です`);
        }
      }
      
      if (i === tokens.length - 1) {
        throw new Error(`演算子 '${tokens[i]}' の位置が不正です`);
      }
      
      const left = parseFloat(tokens[i - 1]);
      const right = parseFloat(tokens[i + 1]);
      
      if (isNaN(left) || isNaN(right)) {
        throw new Error('無効な数値が含まれています');
      }
      
      const result = tokens[i] === '+' ? left + right : left - right;
      
      // 結果で置き換え
      tokens.splice(i - 1, 3, result.toString());
      i = Math.max(0, i - 1);
    } else {
      i++;
    }
  }
  
  if (tokens.length !== 1) {
    throw new Error('数式の形式が正しくありません');
  }
  
  const finalResult = parseFloat(tokens[0]);
  if (isNaN(finalResult)) {
    throw new Error('計算結果が無効です');
  }
  
  return finalResult;
};

// 文字列をトークンに分割
const tokenize = (expression: string): string[] => {
  const tokens: string[] = [];
  let currentToken = '';
  
  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    
    if (char === ' ') {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
    } else if (['+', '-', '*', '/'].includes(char)) {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push(char);
    } else if (char.match(/[0-9.]/)) {
      currentToken += char;
    } else {
      throw new Error(`無効な文字です: '${char}'`);
    }
  }
  
  if (currentToken) {
    tokens.push(currentToken);
  }
  
  return tokens;
};