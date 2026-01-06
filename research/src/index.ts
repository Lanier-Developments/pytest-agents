#!/usr/bin/env node

/**
 * Research Agent - Main entry point
 *
 * This agent can be invoked from command line or via stdio
 */

import 'reflect-metadata';
import * as readline from 'readline';
import { container } from 'tsyringe';
import { setupContainer } from './di/container';
import { ResearchAgent } from './agent';
import { AgentRequest } from './types';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  // Setup DI container
  setupContainer();

  // Resolve agent from container
  const agent = container.resolve(ResearchAgent);

  // Read request from stdin
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  let inputData = '';

  rl.on('line', (line) => {
    inputData += line;
  });

  rl.on('close', async () => {
    try {
      const request: AgentRequest = JSON.parse(inputData);
      const response = await agent.processRequest(request);
      console.log(JSON.stringify(response));
      process.exit(response.status === 'success' ? 0 : 1);
    } catch (error) {
      logger.error(`Error processing request: ${error}`);
      console.log(
        JSON.stringify({
          status: 'error',
          data: { error: String(error) },
        })
      );
      process.exit(1);
    }
  });
}

main().catch((error) => {
  logger.error(`Fatal error: ${error}`);
  process.exit(1);
});
