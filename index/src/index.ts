#!/usr/bin/env node

/**
 * Index Agent - CLI Entry Point
 */

import * as readline from 'readline';
import { IndexAgent, AgentRequest } from './agent';
import { logger } from './utils/logger';

async function main() {
  const agent = new IndexAgent();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  let inputBuffer = '';

  rl.on('line', (line) => {
    inputBuffer += line;
  });

  rl.on('close', async () => {
    try {
      const request: AgentRequest = JSON.parse(inputBuffer);
      const response = await agent.processRequest(request);

      // Write response to stdout (Python reads this)
      console.log(JSON.stringify(response));
    } catch (error) {
      logger.error(`Failed to process request: ${error}`);

      const errorResponse = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };

      console.log(JSON.stringify(errorResponse));
      process.exit(1);
    }
  });
}

main().catch((error) => {
  logger.error(`Fatal error: ${error}`);
  process.exit(1);
});
