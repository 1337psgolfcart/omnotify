import chalk from 'chalk';

chalk.level = 3;

let successCounter = 0;
let errorCounter = 0;
let warningCounter = 0;
let infoCounter = 0;
let webInfoCounter = 0;
let webSuccessCounter = 0;
let webErrorCounter = 0;
let webWarningCounter = 0;
let dividerCounter = 0;
let smallDividerCounter = 0;


let logQueue = [];

async function addToLogQueue(msg, type) {
    const myId = Symbol('logEntry');
    logQueue.push(myId);

    // Warten, bis an der Reihe
    while (logQueue[0] !== myId) {
        await sleep(50);
    }

    try {
        await messageChunkerAndSender(msg, type);
    } finally {
        // Platz für den Nächsten machen
        logQueue.shift();
    }
}

async function resetCounters() {
    successCounter = 0;
    errorCounter = 0;
    warningCounter = 0;
    infoCounter = 0;
}

async function messageChunkerAndSender(msg = null, type = null) {
    if (type.includes('small')) { smallDividerCounter++; };
    if (!type.includes('small') && type.includes('divider')) { dividerCounter++; smallDividerCounter = 0;};
      
    if (type.includes('divider')) {
        await resetCounters();
    }
    msg = msg ? msg : "No Message provided";
    let conlog = console.log;
    let chalkColor = chalk.bgWhiteBright.black;

    let base = "";

    switch (true) {
        case type.includes('success'):      base = `[SUCCESS | ${successCounter}]`; chalkColor = chalk.bgGreenBright.black; conlog = console.log; break;
        case type.includes('error'):        base = `[ERROR | ${errorCounter}]`; chalkColor = chalk.bgRedBright.black; conlog = console.error; errorCounter++; break;
        case type.includes('terminate'):    base = `[TERMINATE | FATAL]`; chalkColor = chalk.bgRed.white.bold; conlog = console.error; break;
        case type.includes('warning'):      base = `[WARNING | ${warningCounter}]`; chalkColor = chalk.bgYellowBright.black; conlog = console.warn; warningCounter++; break;
        case type.includes('info'):         base = `[INFO | ${infoCounter}]`; chalkColor = chalk.bgBlueBright.black; conlog = console.log; infoCounter++; break;
        case type.includes('log'):          base = ``; chalkColor = chalk.bgBlack.white; conlog = console.log; break;
        case type.includes('rainbow'):      base = `[RAINBOW]`; chalkColor = bgRainbow; conlog = console.log; break;
        case type.includes('webinfo'):      base = `[WEB | INFO | ${webInfoCounter}]`; chalkColor = chalk.bgBlueBright.black; conlog = console.log; webInfoCounter++; break;
        case type.includes('websuccess'):   base = `[WEB | SUCCESS | ${webSuccessCounter}]`; chalkColor = chalk.bgGreenBright.black; conlog = console.log; webSuccessCounter++; break;
        case type.includes('weberror'):     base = `[WEB | ERROR | ${webErrorCounter}]`; chalkColor = chalk.bgRedBright.black; conlog = console.error; webErrorCounter++; break; 
        case type.includes('webwarning'):   base = `[WEB | WARNING | ${webWarningCounter}]`; chalkColor = chalk.bgYellowBright.black; conlog = console.warn ;webWarningCounter++; break;
        case type.includes('webfatal'):     base = `[WEB | FATAL]`; break;
        default: base = `[???]`; chalkColor = chalk.bgWhiteBright.black; conlog = console.log; break;
    }

    if (!type.includes('divider')) {
        switch (true) {
            case type.includes('success'):      successCounter++; break;
            case type.includes('error'):        errorCounter++; break;
            case type.includes('warning'):      warningCounter++; break;
            case type.includes('info'):         infoCounter++; break;
            case type.includes('webinfo'):      webInfoCounter++; break;
            case type.includes('websuccess'):   webSuccessCounter++; break;
            case type.includes('weberror'):     webErrorCounter++; break; 
            case type.includes('webwarning'):   webWarningCounter++; break;
        }
    }


    // Variables for all Log Messages    
    const columns = (process.stdout.columns >= 30 ? process.stdout.columns : 30);


    // Variables for Normal Log Messages
    let chunkedMessage = [];
    const baseLength = base.length;
    let availableWidth = columns - baseLength - 1;
    const parts = msg.split('|');


    
    if (!type.includes('divider')) {
        for (let i = 0; i < parts.length; i++) {
            let currentPart = parts[i].trim(); // Wir arbeiten nur mit dem Teil!
            if (currentPart.length === 0) continue;

            // 2. Prüfen ob der Teil direkt passt
            if ((baseLength + 1 + currentPart.length) <= columns) {
                chunkedMessage.push(currentPart);
            } else {
                // 3. Wenn der Teil zu lang ist -> Word Wrap innerhalb des Teils
                while (currentPart.length > 0) {
                    if (currentPart.length <= availableWidth) {
                        chunkedMessage.push(currentPart);
                        break;
                    }

                    let cutPoint = currentPart.lastIndexOf(' ', availableWidth);
                    if (cutPoint === -1 || cutPoint === 0) {
                        cutPoint = availableWidth;
                    }

                    chunkedMessage.push(currentPart.substring(0, cutPoint).trim());
                    currentPart = currentPart.substring(cutPoint).trim();
                }
            }
        }
    }
/*  
DIVIDER MESSAGE FORMATTING
*/
// Variables for Divider Log Messages
    // Variablen initialisieren
    let chunkedMessageDivider = [];
    const activeCounter = type.includes('small') ? smallDividerCounter : dividerCounter;
    const counterStr = (type == 'dividerterminate' ? "-" : activeCounter).toString();
    const counterLen = counterStr.length;

    // Platzberechnung
    const totalSpaceForText = columns - (counterLen + 20); // Deine Vorgabe
    const paddingLeftAmount = Math.max(0, Math.floor((columns - totalSpaceForText) / 2) - counterLen);

    if (type.includes('divider')) {
        for (let i = 0; i < parts.length; i++) {
            let currentPart = parts[i].trim();
            if (currentPart.length === 0) continue;

            while (currentPart.length > 0) {
                let chunk = "";

                if (currentPart.length <= totalSpaceForText) {
                    // Passt komplett rein
                    chunk = currentPart;
                    currentPart = ""; // Beendet die while-Schleife
                } else {
                    // Wort-Wrap Logik
                    let cutPoint = currentPart.lastIndexOf(' ', totalSpaceForText);

                    // Wenn kein Leerzeichen gefunden wurde oder das Wort zu lang ist
                    if (cutPoint <= 0) {
                        cutPoint = totalSpaceForText;
                    }

                    chunk = currentPart.substring(0, cutPoint).trim();
                    currentPart = currentPart.substring(cutPoint).trim();
                }

                // Zeile zusammenbauen: Counter + Padding + Text
                let fullLine = `${counterStr}${" ".repeat(paddingLeftAmount)}${chunk}`;
                
                // Mit padEnd sicherstellen, dass die Zeile exakt "columns" lang ist
                chunkedMessageDivider.push(fullLine.padEnd(columns));
            }
        }
    }
    
    if (!type.includes('small') && type.includes('divider')) { 
        chunkedMessageDivider.unshift('-'.repeat(columns));
        chunkedMessageDivider.push('-'.repeat(columns))
    }

    switch (true) {
        case (!type.includes('divider')):
            chunkedMessage.forEach(message => conlog(chalkColor(base) + " " + message)); conlog();
            break;
        case (type.includes('divider') || type.includes('small')):
            chunkedMessageDivider.forEach(message => conlog(chalkColor(message))); conlog();
            break;
        default:
            chunkedMessage.forEach(message => console.log(base + " " + message)); console.log();
            break;
    }
}

const clog = {
    red: async (msg) => console.log(chalk.bgRed((msg || ""))),
    green: async (msg) => console.log(chalk.bgGreen((msg || ""))),
    yellow: async (msg) => console.log(chalk.bgYellow((msg || ""))),
    blue: async (msg) => console.log(chalk.bgBlue((msg || ""))),

    success: async (msg ) => { await addToLogQueue(msg, 'success'); },
    error: async (msg) => { await addToLogQueue(msg, 'error'); },
    warning: async (msg) => { await addToLogQueue(msg, 'warning'); },
    info: async (msg) => { await addToLogQueue(msg, 'info'); },
    terminate: async (msg) => { await addToLogQueue(msg, 'terminate'); },
    log: async (msg) => { await addToLogQueue(msg, 'log'); },
    rainbow: async (msg) => { await addToLogQueue(msg, 'rainbow'); },

    divider: async (msg) => { await addToLogQueue(msg, 'divider'); },
    dividerTerminate: async (msg) => { await addToLogQueue(msg, 'dividerterminate'); },
    dividerSuccess: async (msg) => { await addToLogQueue(msg, 'dividersuccess'); },
    dividerError: async (msg) => { await addToLogQueue(msg, 'dividererror'); },
    dividerWarning: async (msg) => { await addToLogQueue(msg, 'dividerwarning'); },
    dividerInfo: async (msg) => { await addToLogQueue(msg, 'dividerinfo'); },
    dividerRainbow: async (msg) => { await addToLogQueue(msg, 'dividerrainbow'); },

    smallDivider: async (msg) => { await addToLogQueue(msg, 'smalldivider'); },
    smallDividerSuccess: async (msg) => { await addToLogQueue(msg, 'smalldividersuccess'); },
    smallDividerError: async (msg) => { await addToLogQueue(msg, 'smalldividererror'); },
    smallDividerWarning: async (msg) => { await addToLogQueue(msg, 'smalldividerwarning'); },
    smallDividerInfo: async (msg) => { await addToLogQueue(msg, 'smalldividerinfo'); },
    smallDividerRainbow: async (msg) => { await addToLogQueue(msg, 'smalldividerrainbow'); },

    web: {
        info: async (obj, msg) => {
            // Wenn Fastify ein Objekt schickt, nimm obj.msg, sonst den String msg
            const message = typeof obj === 'string' ? obj : (msg || obj.msg || "");
            messageChunkerAndSender(message, 'webinfo');
        },

        // Fehler im Web-Stack (500er, Crashs)
        error: async (obj, msg) => {
            const message = typeof obj === 'string' ? obj : (msg || obj.msg || "");
            messageChunkerAndSender(message, 'weberror');
            // Falls ein technischer Error-Stack dabei ist, loggen wir ihn separat als Fehler
            if (obj.err) messageChunkerAndSender(obj.err.stack, 'error');
        },

        // Warnungen (404er, falsche Payloads)
        warn: async (obj, msg) => {
            const message = typeof obj === 'string' ? obj : (msg || obj.msg || "");
            messageChunkerAndSender(message, 'webwarning');
        },

        // Kritische Web-Fehler
        fatal: async (obj, msg) => {
            const message = typeof obj === 'string' ? obj : (msg || obj.msg || "");
            messageChunkerAndSender(message, 'webfatal');
        },

        // Debug & Trace (oft sehr viel Output, daher auf 'log' oder 'webinfo' gemappt)
        debug: async (obj, msg) => {
            const message = typeof obj === 'string' ? obj : (msg || obj.msg || "");
            messageChunkerAndSender(message, 'log');
        },
        trace: (obj, msg) => {
            const message = typeof obj === 'string' ? obj : (msg || obj.msg || "");
            messageChunkerAndSender(message, 'log');
        },

        // Notwendig für Fastify-Interne Hooks
        child: async function() { 
            return this; 
        }
    }
}

export default clog;


/*
SLEEP
*/
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*
RANDOM ASS FUNCTIONS
*/


function bgRainbow(text) {
    const chars = text.split('');
    const len = chars.length;
    
    return chars.map((char, i) => {
        const step = i / len;
        
        const r = Math.round(Math.sin(Math.PI * 2 * step + 0) * 96 + 159);
        const g = Math.round(Math.sin(Math.PI * 2 * step + 2) * 96 + 159);
        const b = Math.round(Math.sin(Math.PI * 2 * step + 4) * 96 + 159);

        // Hintergrundfarbe setzen, Text auf Schwarz fixieren
        return chalk.bgRgb(r, g, b).black(char);
    }).join('');
}