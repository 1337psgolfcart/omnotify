import nodemailer from 'nodemailer';
import { clog, terminate } from '../../../functionsBarrel/barrel.js';
import { config } from '../../../config.js';
import { emailTemplate } from './functions/loadMailTemplate.js';

let transporter = null;

export async function shutdownEmail() {
    try {
        await transporter.close();
        clog.success('Email Transporter closed');
    } catch (err) {
        clog.error(`Email Transporter did not shut down Gracefully. ERROR: ${err}`)
    }
}

export async function createEmailTransporter(mailConfig) {
    const isSecure = (mailConfig.smtpSecure === 'STARTTLS');

    transporter = new nodemailer.createTransport({
        host: mailConfig.smtpServer,
        port: mailConfig.smtpPort, // Meistens 587 für TLS oder 465 für SSL
        secure: isSecure, // true für Port 465, false für andere
        ignoreTLS: mailConfig.smtpSecure === "none",
        requireTLS: mailConfig.smtpSecure !== "none",
        ...(mailConfig.username && mailConfig.password && {
            auth: {
                user: mailConfig.username,
                pass: mailConfig.password
            }
        }),    
        ...(mailConfig.smtpSecure === "STARTTLS" || mailConfig.smtpSecure === "TLS" && {
            tls: {
                ciphers: 'SSLv3',
            }
        }),
        from: mailConfig.username,
    });
    
    clog.success('Creating Email Transporter');

    clog.info('Testing E-Mail Server connection');
    try {
        transporter.verify();
        clog.success("E-Mail Server connection successful");
    } catch (err) {
        clog.error("E-Mail Server connection failed: ", err.message);
        terminate(3);
    }
    
}

export async function sendEmail(address, message) {
    const mailConfig = config.email;
    
    let title = message.title.replaceAll(/\n/g, '<br>');
    let msg = message.message.replaceAll(/\n/g, '<br>');
    let requestIP = message.requestIP.replaceAll(/\n/g, '<br>');
    let time = await getTime();

    let emailHTML = emailTemplate.replaceAll('{{message}}', msg);
    emailHTML = emailHTML.replace('{{title}}', title);
    emailHTML = emailHTML.replace('{{time}}', time);

    try {
        await transporter.sendMail({
            from: `"Omnotify | Self-hosted" <${mailConfig.senderAddress}>`,
            to: address,
            subject: "Omnotify Notification",
            text: `Omnotify Notification:<br> ${title}<br>${msg}<br>${time}`,
            html: emailHTML
        })

        clog.success(`Email sent to ${address} successfully`);
    } catch (e) {
        clog.error(`Error Sending E-Mail:| ${e.message} `)
    }
}

async function getTime() {
    const now = new Date();

    // 1. Get Day Name (e.g., Monday)
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

    // 2. Get Day with Suffix (e.g., 1st, 2nd)
    const day = now.getDate();
    const suffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
    };


    // 3. Get Month and Year
    const month = now.toLocaleDateString('en-US', { month: 'long' });
    const monthShort = String(now.getMonth() + 1).padStart(2, '0');

    const year = now.getFullYear();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedDate = `${dayName}, ${day}${suffix(day)} of ${month}, ${year} | ${hours}:${minutes}<br>${String(day).padStart(2, '0')}.${monthShort}.${year} | ${hours}:${minutes}`;

    return formattedDate; 
}