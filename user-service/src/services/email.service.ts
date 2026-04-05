import { api } from '../config/api';
import { MailRequest } from '../interfaces/requests';

export async function sendRegisterOTPEmail(userId: any, email: string, otp: string): Promise<boolean> {
        try {
        const mailReq =  {
            mailOptions: {
                to: email,
                subject: 'Account Verification OTP',
                text: `Your OTP for account verification is: ${otp}. This code will expire in 10 minutes.`
            },
            userId: userId,
            type: "REGISTER_OTP_SEND"
        };
            const response = await api.post(`notification/email/send/`, mailReq);
            return response.data.success;
        } catch (error) {
            return false
        }
    }

export async function sendWelcomeEmail(userId: any, email: string, username: string): Promise<boolean> {
    try {
        const mailReq =  {
            mailOptions: {
                to: email,
                subject: 'Welcome to Smart Wallet!',
                text: `Hi ${username}, \n\nWelcome to Smart Wallet! We are excited to have you on board. Start tracking your finances and achieving your goals today.`
            },
            userId: userId,
            type: "NEW_USER_WELCOME_SEND"
        };
        const response = await api.post(`notification/email/send/`, mailReq);
        return response.data.success;
    } catch (error) {
        return false;
    }
}

export async function sendSpaceInvitationEmail(userId: any, email: string, space: string, link: string): Promise<boolean> {
        try {
        const mailReq =  {
            mailOptions: {
                to: email,
                subject: 'Space invitation',
                text: `Click below link to join to space ${space}: \n Link: ${link}`
            },
            userId: userId,
            type: "SPACE_INVITATION_SEND"
        };
            const response = await api.post(`notification/email/send/`, mailReq);
            return response.data.success;
        } catch (error) {
            return false
        }
    }

// export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
//     try {
//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: 'Account Verification OTP',
//             text: `Your OTP for account verification is: ${otp}. This code will expire in 10 minutes.`
//         };

//         await transporter.verify(); // Verify connection configuration
//         const info = await transporter.sendMail(mailOptions);
//         console.log('Email sent successfully:', info.response);
        
//     } catch (error) {
//         console.error('Error sending email:', error);
//         throw new Error(`Failed to send OTP email: ${error}`);
//     }
// };
