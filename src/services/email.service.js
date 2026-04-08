import nodemailer from "nodemailer";
import config from "../config/config.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: config.GOOGLE_USER,
        refreshToken: config.GOOGLE_REFRESH_TOKEN,
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET
    }
});

const sendEmail = async (to, subject, text, html) => {
    try {
        await transporter.sendMail({
            from: config.GOOGLE_USER,
            to,
            subject,
            text,
            html
        });
    } catch (error) {
        console.log(error);
    }
};

export default sendEmail;