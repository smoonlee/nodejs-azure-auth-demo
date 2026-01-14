import { createServer } from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './logger';

const app = createApp();
const server = createServer(app);

const port = config.port;

server.listen(port, () => {
  logger.info(`API listening on port ${port}`);
});
