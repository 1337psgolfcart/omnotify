import nodemailer from 'nodemailer';
import { clog, terminate } from '../../../functionsBarrel/barrel.js';
import { config } from '../../../config.js';


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
    clog.log('Sending Email');

    const mailConfig = config.email;
    
    await transporter.sendMail({
        from: `"Omnotify | Self-hosted" <${mailConfig.senderAddress}>`,
        to: address,
        subject: "Omnotify Notification",
        text: message,
        html: `<b>${message}</b>`,
    })
    clog.success(`Email sent to ${address} successfully`);
    
}
