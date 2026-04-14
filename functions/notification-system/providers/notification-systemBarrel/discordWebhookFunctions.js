import { clog, terminate } from '../../../functionsBarrel/barrel.js';
import { logo } from './functions/loadLogo.js'


export async function discordWebhookCheck(url) {
    try {   
        const response = await fetch(url, {
        method: 'GET' 
        });

        if (response.status === 200) {
        const data = await response.json();
        const msg = `Name: ${JSON.stringify(data.name)}, Channel ID: ${JSON.stringify(data.channel_id)}`;
        return [true, msg];
        } else if (response.status === 404) {
        clog.error('Webhook existiert nicht (404).');
        return false;
        } else if (response.status === 401) {
        clog.error('Webhook-Token ist ungültig (401).');
        return false;
        }
    } catch (error) {
        clog.error('Netzwerkfehler beim Validieren:', error);
        return false;
    }
}

export async function sendDiscordWebhook(url, message) {
    clog.info('Sending Discord Webhook');
    let title = message.title
    let msg = message.message
    const fileName = `logo.png`

    const randomColor = Math.floor(Math.random() * 16777216);

    const embed = [{
        title: "Omnotify Notification",
        type: "rich",
        description: `## ${title}\n${msg}`,
        color: randomColor,
        timestamp: new Date().toISOString(),
        thumbnail: {
            url: `attachment://${fileName}`
        }
    }]

    const webHook = { 
        username: "Omnotify Self-Hosted",
        embeds: embed,
    };

    const formData = new FormData();
    
    // Das JSON muss als String in das Feld 'payload_json'
    formData.append('payload_json', JSON.stringify(webHook));
    
    // Die Datei aus deinem Buffer (logo.plain) anhängen
    const fileBlob = new Blob([logo.uncompressed.plain], { type: 'image/png' });
    formData.append('files[0]', fileBlob, fileName);


    const response = await fetch(url, {
        method: 'POST',
        body: formData,
        })
    if (!response.ok) {
        const errorText = await response.text();
        clog.error(`Discord API Error: ${response.status} - ${errorText}`);
        return false;
    } else {
        clog.success('Discord Webhook sent successfully');
        return true;
    }
}

