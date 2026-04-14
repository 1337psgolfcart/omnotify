import { config as loadEnv } from 'dotenv-esm';
import { clog, terminate } from './functionsBarrel/barrel.js';


function validateConfig(cfg) {
    clog.dividerInfo('CONFIGURATION VALIDATION');
    clog.info('Validating configuration...');
    const errors = [];
    const informations = [];
    const logs = [];
    let usedProviders = ``;

    // BASIC CONNECTION DETAILS
    if (!cfg.apiKey && !process.env.OMNOTIFY_API_KEY) {
        errors.push('No API key provided');            
    }
    
    if (!cfg.port || isNaN(cfg.port)) {
        informations.push('No port provided, using default port 8080');
    }

    // PROVIDER CHECKS (If no provider given, stops check immediately)
    if (!Array.isArray(cfg.providers) || cfg.providers.length === 0) {
        informations.push('No providers provided. Using Console for testing purposes.');
        cfg.providers = ['console'];
    } else {
        if (cfg.providers.includes('console')) {
            informations.push('Console was set manually.');
            usedProviders += 'Console|';
        }

        if (cfg.providers.includes('discorddm')) {
            if (!cfg.discordDM.botToken || !cfg.discordDM.userID) {
                errors.push('Discord DM is set as provider, but no bot token or user ID provided.');
            }
            logs.push('Discord DM');
            usedProviders += 'Discord DM|';
        }

        if (cfg.providers.includes('discordwebhook')) {
            if (!cfg.discordWebhook.url) {
                errors.push('Discord Webhook is set as provider, but no URL provided.');
            }
            if (!URL.canParse(cfg.discordWebhook.url) && cfg.discordWebhook.url) {
                errors.push('Discord Webhook URL is invalid.'); 
            }
            logs.push('Discord Webhook');
            usedProviders += 'Discord Webhook|';
        }
        
        if (cfg.providers.includes('email')) {
            logs.push('Email');
            if (!cfg.email.username || !cfg.email.password || !cfg.email.smtpServer || !cfg.email.senderAddress || !cfg.email.receiverAddress) {
                errors.push('Email is set as provider, but no username, password, SMTP server, sender address or receiver address provided.');
            }
            usedProviders += 'Email|';
        
        }

        if (informations.length > 0) {
            informations.forEach(info => clog.info(info));
            clog.smallDividerInfo('Everything above this message is informational. This will not prevent Booting.');
        }
    }

    if (errors.length > 0) {
        errors.forEach(error => clog.error(error));
        clog.error('Process exiting, invalid configuration.');
        terminate(1);
    };

    clog.smallDividerInfo('Using the following providers:');
    clog.info(usedProviders);

    clog.smallDividerSuccess('Configuration validation passed.');
}


function variableSplitting(variable) {
    if (variable.includes(',')) {
        let variableSplit = '';
        let index = 0;
        let value = '';
        variable.split(',').forEach(variablePart => {
            index++;
            variableSplit += `${index}: ` + variablePart + '|';
        });                        
        return variableSplit;
    
    } else {
        return variable;
    }
}

function variableSplittingSensitive(variable) {
    let value = '';

    if (variable.includes(',')) {
        let variableSplit = '';
        let index = 0;
        
        variable.split(',').forEach(nothing => {
            index++;
            value = '*'.repeat(variable.length);
            variableSplit += `${index}: ` + value + '|';
        });     

        return variableSplit;
    } else {
        value = '*'.repeat(variable.length);

        return value;
    };
}

export const loadConfig = () => { 
    clog.dividerRainbow('OMNOTIFY|The Easy HTTP Notification Solution|HTTPS://GITHUB.COM/1337PSGOLFCART/OMNOTIFY|');



    clog.dividerInfo('Loading Environment Variables')

    loadEnv();

    const sensitiveKeywords = [
    'KEY', 
    'WEBHOOK_URL', 
    'PASSWORD', 
    'USERNAME', 
    'SENDER_ADDRESS', 
    'RECEIVER_ADDRESS'
    ];

    let environmentVariables = [];
    
    for (let key in process.env) {
        let value = process.env[key];
        let splitValue = '';
        if (!key.includes('OMNOTIFY')) { continue; };
        if (sensitiveKeywords.some(keyword => key.includes(keyword))) {
            console.log("")
            splitValue = variableSplittingSensitive(value);
            environmentVariables.push(`${key}:|${splitValue}`);
        } else {
            splitValue = variableSplitting(value);
            environmentVariables.push(`${key}:|${splitValue}`);
        }        
    }
    
    environmentVariables.forEach(variable => clog.info(variable));
    environmentVariables = [];

    clog.smallDividerSuccess('Environment variables loaded.');
    clog.dividerInfo('LOADING CONFIGURATION');
    clog.info('Attempting to load Configuration...')

    const rawProviders = process.env.OMNOTIFY_PROVIDERS || "";

    let providersArray = rawProviders
        .split(',')
        .map(providerName => providerName.trim())
        .filter(providerName => providerName.length > 0);

    let discordUserIDArray = process.env.OMNOTIFY_DISCORD_DM_USER_ID ? process.env.OMNOTIFY_DISCORD_DM_USER_ID.split(',') : [];
    let discordWebhookArray = process.env.OMNOTIFY_DISCORD_WEBHOOK_URL ? process.env.OMNOTIFY_DISCORD_WEBHOOK_URL.split(',') : [];
    let receiverEmailArray = process.env.OMNOTIFY_EMAIL_RECEIVER_ADDRESS ? process.env.OMNOTIFY_EMAIL_RECEIVER_ADDRESS.split(',') : [];    
    
    if (!providersArray || providersArray.length === 0) {
        providersArray = ['console'];
    };

    const finalConfig = {
        apiKey: process.env.OMNOTIFY_API_KEY || "",
        hostIP: process.env.OMNOTIFY_HOST_IP || "0.0.0.0",
        port: parseInt(process.env.OMNOTIFY_PORT) || 11111,
        allowedIPs: process.env.OMNOTIFY_ALLOWED_IPS ? process.env.OMNOTIFY_ALLOWED_IPS.split(',') : [],
        allowedHosts: process.env.OMNOTIFY_ALLOWED_DOMAINS ? process.env.OMNOTIFY_ALLOWED_DOMAINS.split(',') : [],
        providers: providersArray,
        ...(providersArray.includes('discorddm') && {
            discordDM: {
                botToken: process.env.OMNOTIFY_DISCORD_DM_BOT_TOKEN || "",
                userID: discordUserIDArray || [],
                singleEPmode: process.env.OMNOTIFY_DISCORD_DM_SINGLE_ENDPOINT_MODE === "true" ? true : false
            }
        }),
        ...(providersArray.includes('discordwebhook') && {
            discordWebhook: {
                url: discordWebhookArray || [],
                singleEPmode: process.env.OMNOTIFY_DISCORD_WEBHOOK_SINGLE_ENDPOINT_MODE === "true" ? true : false
            }
        }),
        ...(providersArray.includes('email') && {
            email: {
                username: process.env.OMNOTIFY_EMAIL_USERNAME || "",
                password: process.env.OMNOTIFY_EMAIL_PASSWORD || "",
                smtpServer: process.env.OMNOTIFY_EMAIL_SMTP_SERVER || "",
                smtpPort: parseInt(process.env.OMNOTIFY_EMAIL_SMTP_PORT) || 587,
                smtpSecure: process.env.OMNOTIFY_EMAIL_SMTP_SECURE || "none",
                senderAddress: process.env.OMNOTIFY_EMAIL_SENDER_ADDRESS || "",
                receiverAddress: receiverEmailArray || [],
                singleEPmode: process.env.OMNOTIFY_EMAIL_SINGLE_ENDPOINT_MODE === "true" ? true : false
            }
        }),
    };
    clog.smallDividerSuccess('Configuration loaded.');
    validateConfig(finalConfig);

    return Object.freeze(finalConfig);
}

export const config = loadConfig()

