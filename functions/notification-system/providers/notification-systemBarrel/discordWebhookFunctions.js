import { clog, terminate } from '../../../functionsBarrel/barrel.js';



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

    const webHook = { 
        username: "Omnotify Self-Hosted",
        content: String(message),
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(webHook)
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

