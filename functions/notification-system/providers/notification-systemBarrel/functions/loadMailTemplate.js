import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { clog, terminate } from '../../../../functionsBarrel/barrel.js';
import { logo } from './loadLogo.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadMailTemplate() {
    try {
        let mailTemplate = await fs.readFile(path.join(__dirname, '../../../../../customizations/emailTemplate.html'), 'utf8');   
        
        mailTemplate = mailTemplate.replace('{{imagebase64}}', `${logo.compressed.base64}`);
        clog.success('Email Template loaded');
        return Object.freeze(mailTemplate);
    } catch (error) {
        clog.terminate(`Error loading Mail-Template:| ${error.message}`);
        terminate(6);

    }
};

export const emailTemplate = await loadMailTemplate();
