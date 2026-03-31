import clog from './chalkShortcuts.js';

const MESSAGES = {
    0: "SIGTERM or SIGINT received.",
    1: "Configuration Validation failed: Invalid configuration.",
    2: "Webserver has crashed. Look above for the error.",
    3: "E-Mail Server connection failed.",
    4: "Discord Webhook provided is wrong.",
    5: "Webserver Endpoint could not be created!",
    99: "Kritischer Systemfehler."
};

const terminate = async (code) => {
  const msg = MESSAGES[code] || "Unbekannter Fehler.";
  if (code === 0) {
    await clog.success('EXIT CODE (0): Graceful Shutdown Complete.');
    process.exit(0);
  }

  clog.dividerTerminate('TERMINATING...');
  await clog.terminate(`EXIT CODE (${code}): ${msg}`);

  process.exit(code);
};

export default terminate;