import { clog, terminate } from './functions/functionsBarrel/barrel.js';
import { config } from './functions/config.js';
import { startServer, shutdownOrder } from './functions/notification-system/web-backend.js';
let isShuttingDown = false;

await startServer(config);





/*
SLEEP
*/
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
/*
Graceful Shutdown
*/
const gracefulShutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true
    clog.dividerTerminate('SIGTERM/SIGINT TERMINATION');
    await shutdownOrder();
    terminate(0);
};

/*
Signal Handlers | SIGINT + SIGTERM
*/
['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => {
        gracefulShutdown(signal);
    });
});
