import { clog, terminate } from '../../functionsBarrel/barrel.js';
import { createEmailTransporter, sendEmail, shutdownEmail } from './notification-systemBarrel/emailFunctions.js';
import { sendDiscordWebhook, discordWebhookCheck } from './notification-systemBarrel/discordWebhookFunctions.js';
import { config } from '../../config.js';


export async function shutdownProviders() {
    if (config.providers.includes('discorddm')) {
    };

    if (config.providers.includes('email')) {
        await shutdownEmail();
    };

    if (config.providers.includes('discordwebhook')) {
    };
}

async function testRequest(request, reply) {
    
    const requestIP = String(request.ip || "NO IP IN REQUEST? WTF?!");
    const body = request.body || {};
    const message = String(body.message || "OMNOTIFY DEFAULT MESSAGE");
    const title = String(body.title || "OMNOTIFY DEFAULT TITLE");

    const notificationContents = {
        message: message,
        title: title,
        requestIP: requestIP,
    };

    return notificationContents;
}

/*
E-MAIL NOTIFICATION SYSTEM!!!
*/
export async function email(fastify, config) {
    const emailConfig = config.email;
    const endpoints = [];
    let endpointsString = '';
    const errors = [];   

    await createEmailTransporter(emailConfig);

    try {
        fastify.post(`/omnotify/email`, async (request, reply) => {
            clog.info('E-Mail Multiple Endpoint called');
            const notificationContents = await testRequest(request, reply);
            
            for (const address of emailConfig.receiverAddress) {
                try { 
                    await sendEmail(address, notificationContents);
                } catch (error) {
                    clog.error(`Error sending email: ${error.message}`);
                    errors.push('A message has failed sending: ' + error.message);
                }
            };
            if (errors.length > 0) {
                errors.forEach(errorMessage => clog.error(errorMessage))
                return reply.status(500).send({ error: 'Internal Server Error | ATLEAST ONE EMAIL FAILED TO SEND' });
            };
            if (errors.length == 0) {
                return reply.status(200).send({ message: 'Email sent successfully' });
            };
        });
    } catch (error) {
        clog.terminate(`Webpoint not created:|${error.message}`)
        terminate(5);
    }
    endpoints.push(`/omnotify/email`);
    endpointsString += `Contact all Endpoint: /omnotify/email |`;


    if (emailConfig.singleEPmode) {
        clog.info('E-Mail Single Endpoint Mode detected')
        let mailUserCounter = 0;
        
        emailConfig.receiverAddress.forEach(address => {
            mailUserCounter++;
            try {
                fastify.post(`/omnotify/email/${mailUserCounter}`, async (request, reply) => {
                    clog.info(`E-Mail user${mailUserCounter} Endpoint called`);
                    const notificationContents = await testRequest(request, reply);

                    try { 
                        await sendEmail(address, notificationContents);
                        return reply.status(200).send({ message: 'Email sent successfully' });
                    } catch (error) {
                        clog.error(`Error sending email: ${error.message}`);
                        return reply.status(500).send({ error: 'Internal Server Error' });
                    }
                });
            } catch (error) {
                clog.terminate(`Webpoint not created:|${error.message}`)
                terminate(5);
            }
            endpoints.push(`/omnotify/email/${mailUserCounter} |`);
            endpointsString += `Contact ${address} Endpoint: /omnotify/email/${mailUserCounter} |`;
        });
    };
    
    
    return endpoints, endpointsString;
}

/*
DISCORD WEBHOOK NOTIFICATION SYSTEM!!!
*/
export async function discordWebhook(fastify, config) {
    const discordWebhookConfig = config.discordWebhook;

    clog.info('Checking Discord Webhook');
    for (const [index, url] of discordWebhookConfig.url.entries()) {
        const [ webhookExists, message = null ] = await discordWebhookCheck(url);
        if (!webhookExists) terminate(4);
        clog.success(`Discord Webhook ${index + 1} is valid. | ${message}`)
    }
    const endpoints = [];
    let endpointsString = '';
    const errors = [];
    let discordWebhookCounter = 0;

    try {
        fastify.post(`/omnotify/discordwebhook`, async (request, reply) => {
            clog.info('Discord Webhook Contact All Endpoint called');
            const notificationContents = await testRequest(request, reply)
            

            for (const webhookURL of discordWebhookConfig.url) {
                try { 
                    const sent = await sendDiscordWebhook(webhookURL, notificationContents);
                    if (sent) {
                        clog.success('Discord Webhook fired successfully');
                    } else {
                        clog.error('Discord Webhook failed to fire');
                        errors.push('A Discord Webhook has failed to fire');
                    }
                } catch (error) {
                    clog.error(`Error firing Webhook: ${error.message}`);
                    errors.push('A Discord Webhook has failed to fire: ' + error.message);
                }
            };
            
            if (errors.length > 0) {
                errors.forEach(errorMessage => clog.error(errorMessage))
                return reply.status(500).send({ error: 'Internal Server Error | ATLEAST ONE DISCORD WEBHOOK FAILED TO FIRE' });
            };
            
            if (errors.length == 0) {
                return reply.status(200).send({ message: 'Discord Webhook sent successfully' });
            };
            
                    
        });
    } catch (error) {
        clog.terminate(`Webpoint not created:|${error.message}`)
        terminate(5);
    }
        endpoints.push(`/omnotify/discordwebhook |`);
        endpointsString += `Fire All Endpoint: /omnotify/discordwebhook |`;


    if (discordWebhookConfig.singleEPmode) {
        discordWebhookConfig.url.forEach(webhookURL => {
            
            discordWebhookCounter++;
            try {
                fastify.post(`/omnotify/discordwebhook/${discordWebhookCounter}`, async (request, reply) => {
                    clog.info(`Discord Webhook webhook${discordWebhookCounter} Endpoint called`);
                    const notificationContents = await testRequest(request, reply);
                    

                    try { 
                        await sendDiscordWebhook(webhookURL, notificationContents);
                        return reply.status(200).send({ message: 'Discord Webhook fired successfully' });
                    } catch (error) {
                        clog.error(`Discord Webhook: ${error.message}`);
                        return reply.status(500).send({ error: 'Internal Server Error' });
                    }
                });
            } catch (error) {
                clog.terminate(`Webpoint not created:|${error.message}`)
                terminate(5);
            }
            endpoints.push(`/omnotify/discordwebhook/${discordWebhookCounter} |`);
            let messageWebhookURL = webhookURL.slice(-5);

            endpointsString += `Fire Endpoint ending in ${messageWebhookURL}: /omnotify/discordwebhook/${discordWebhookCounter} |`;
            });
    }

    return endpoints, endpointsString;
}






/*
DISCORD DM NOTIFICATION SYSTEM!!!
*/
export async function discordDM(fastify, config) {
    clog.divider('Discord DM Endpoint Creation');
    
    

}