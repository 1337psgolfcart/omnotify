import Fastify from 'fastify';
import { clog, terminate } from '../functionsBarrel/barrel.js'
import { email, discordWebhook, discordDM, shutdownProviders } from './providers/providers.js'

let allEndpoints = [];
let fastify = null

export async function startServer(config) {
    clog.dividerInfo('Creating Web Server')
    fastify = await fastifyObjectCreation();
    
    clog.dividerInfo('Creating Webserver Endpoints')
    await createEndpoints(config, fastify);
    
    clog.dividerInfo('Starting Webserver')
    try {
        // host: '0.0.0.0' ist perfekt für Docker später!
        const address = await fastify.listen({ port: config.port, host: '127.0.0.1' });
        clog.success(`Server ist bereit auf ${address}`);
        return fastify;
    } catch (error) {
        clog.error(`Web Server Crash: ${error.message}`);
        terminate(2);
    }
    
}

async function fastifyObjectCreation() {
    clog.info('Creating the Webserver Object')
        fastify = Fastify({
        logger: false 
    });

    fastify.addHook('onRequest', async (request, reply) => {
        clog.web.info(`Incoming: ${request.method} ${request.url} from ${request.ip}`);
    });

    fastify.addHook('onResponse', async (request, reply) => {
        const msg = `Completed: ${request.method} ${request.url} - Status: ${reply.statusCode}`;
        if (reply.statusCode >= 400) {
            clog.web.warn(msg);
        } else {
            clog.web.info(msg);
        }
    });

    fastify.setErrorHandler((error, request, reply) => {
        clog.web.error(`Server Error: ${error.message}`);
        reply.status(500).send({ error: 'Internal Server Error' });
    });
    clog.success('Webserver Object Created')
    return fastify;
}


async function createEndpoints(config, fastify) {
    clog.info('Creating all Endpoints')
    let allEndpointsString = [];

    if (config.providers.includes('discorddm')) {
        allEndpointsString.push( async () => { clog.smallDividerSuccess('All Discord DM Endpoints:')}, );
        clog.smallDivider('Creating Discord DM Endpoints Creation')
        let [ discordDMEndpoints, discordDMEndpointsString ] = await discordDM(fastify, config);
        allEndpointsString.push(`${discordDMEndpointsString}`);
        allEndpoints = allEndpoints.concat(discordDMEndpoints);
        clog.smallDividerSuccess('Creating Discord DM Endpoints Creation Complete');
    }

    if (config.providers.includes('discordwebhook')) {
        allEndpointsString.push( async () => { clog.smallDividerSuccess('All Discord Webhook Endpoints:')}, );
        clog.smallDivider('Creating Discord Webhook Endpoints Creation');
        let discordWebhookEndpoints, discordWebhookEndpointsString = await discordWebhook(fastify, config);
        allEndpointsString.push(`${discordWebhookEndpointsString}`);
        allEndpoints = allEndpoints.concat(discordWebhookEndpoints);
        clog.smallDividerSuccess('Creating Discord Webhook Endpoints Creation Complete');
    }

    if (config.providers.includes('email')) {
        allEndpointsString.push( async () => { clog.smallDividerSuccess('All E-Mail Endpoints:')}, );
        clog.smallDivider('Creating E-Mail Endpoints');
        let emailEndpoints, emailEndpointsString = await email(fastify, config);
        allEndpointsString.push(`${emailEndpointsString}`);
        allEndpoints = allEndpoints.concat(emailEndpoints);
        clog.smallDividerSuccess('Creating E-Mail Endpoints Creation Complete');

    }

    fastify.get('/', async (request, reply) => {
        return { hello: 'world' }
    });
    clog.dividerSuccess('All Endpoints created');

    clog.dividerSuccess('All Endpoints');
    for (const endpoint of allEndpointsString) {
        if (typeof endpoint === 'string') {clog.success(endpoint); };
        if (typeof endpoint === 'function') { await endpoint(); };
    };
}

export async function shutdownOrder() {
    clog.info('Shutting Down Webserver')
    try {
        await fastify.close();
        clog.success('Web Server closed');
    } catch (err) {
        clog.error(`Webserver did not shut down Gracefully. ERROR: ${err}`)
    } finally {
        shutdownProviders();
    }

}