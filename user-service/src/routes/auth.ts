import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/user';
import OTP from '../models/otp';
import jwt from 'jsonwebtoken';
import { CreateAccountRequest, VerifyOTPRequest, CreateSpaceRequest, FacebookLoginRequest } from '../interfaces/requests';
import { generateOTP } from '../utils/otp.util';
import { sendRegisterOTPEmail } from '../services/email.service';
import { createWelcomeNotification } from '../services/notification.service';
import { initializeUserNotificationPreferences } from '../services/notification-preference.service';
import Plan, { PlanType } from '../models/plan';
import Subscription, { SubscriptionStatus } from '../models/subscription';
import { LoginStatus } from '../interfaces/responses';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';
import dotenv from 'dotenv';
import { authenticate } from '../middlewares/auth';
import Space, { SpaceType, COLLABORATOR_STATUS} from '../models/space';
import { Types } from 'mongoose';

dotenv.config();
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

const authRouter = express.Router();

// {
//     "email": "user@example.com",
//     "username": "testuser",
//     "password": "yourpassword"
// }
authRouter.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, username, password, currency }: CreateAccountRequest = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            res.status(400).json({
                success: false,
                error: { message: 'User with this email exists. Try Login.' },
                data: null
            });
            return;
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user with currency as null and enabled as false
        const newUser = await User.create({
            email,
            username,
            password: hashedPassword,
            currency: currency,
            enabled: false,
            blockedUntil: null
        });

        // Initialize notification preferences
        await initializeUserNotificationPreferences(newUser._id);

        // Subscribe starter plan by default
        const plan = await Plan.findOne({ name: PlanType.STARTER })
        const now = Date.now();
        await Subscription.create({
            userId: newUser._id,
            planId: plan!._id,
            paymentId: null,
            startDate: now,
            endDate: now,
            lastBillingDate: now,
            nextBillingDate: now,
            status: SubscriptionStatus.ACTIVE,
            autoRenew: false
        });

        // Remove password from response
        const userResponse = newUser.toObject();
        delete (userResponse as { password?: string }).password;

        res.status(201).json({
            success: true,
            data: {
                object: userResponse,
                message: 'Account is created. Please verify your email.'
            },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating account: ' + errorMessage },
            data: null
        });
    }
});

// {
//     "email": "user@example.com",
//     "otpCode": "123456"
// }
authRouter.post('/verify-otp', async (req: Request, res: Response) => {
    try {
        const { email, otpCode }: VerifyOTPRequest = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found. email: ' + email },
                data: null
            });
            return;
        }

        if (user.enabled) {
            res.status(404).json({
                success: false,
                error: { message: 'User is already verified. Try login.' },
                data: null
            });
            return;
        }

        if (user.blockedUntil && user.blockedUntil > new Date()) {
            const remainingTime = user.blockedUntil!.getTime() - Date.now();
            const minutesRemaining = Math.ceil(remainingTime / (1000 * 60));
            res.status(429).json({
                success: false,
                error: {
                    message: `Maximum resend attempts reached. Please try login after ${minutesRemaining} minutes`,
                },
                data: null
            });
        }

        // Find valid OTP
        const otp = await OTP.findOne({
            userId: user._id,
            code: otpCode.toString(),
            expiredAt: { $gt: new Date() }
        });

        // console.log("otp: ", otp?.code);
        // console.log("date: ", new Date());

        if (!otp) {
            res.status(400).json({
                success: false,
                error: { message: 'Invalid or expired OTP' },
                data: null
            });
            return;
        }

        // Enable user account
        const savedUser = await User.findByIdAndUpdate(user._id, {
            enabled: true,
            blockedUntil: null,
        });

        // Delete used OTP
        await OTP.deleteOne({ _id: otp._id });

        const space = await Space.create({
            ownerId: savedUser?._id,
            type: SpaceType.CASH,
            isDefault: true,
            name: "cash in hand"
        })

        res.status(200).json({
            success: true,
            data: { message: 'OTP verified successfully', object: savedUser },
            error: null
        });

        // Create welcome notification (sends both in-app and email)
        await createWelcomeNotification(savedUser?._id?.toString() || '', savedUser?.username || 'User');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error verifying account: ' + errorMessage },
            data: null
        });
    }
});

// {
//     "email": "user@example.com"
// }
authRouter.post('/resend-otp', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found' },
                data: null
            });
            return;
        }

        const existingOTP = await OTP.findOne({
            userId: user._id,
            expiredAt: { $gt: new Date() }
        });

        // Check if user is blocked
        if (user.blockedUntil) {
            // console.log("user blocked")
            if (user.blockedUntil > new Date()) {
                // console.log("time remaining to unlock")
                const remainingTime = user.blockedUntil.getTime() - Date.now();
                const minutesRemaining = Math.ceil(remainingTime / (1000 * 60));
                res.status(429).json({
                    success: false,
                    error: {
                        message: `Too many attempts. Try again after ${minutesRemaining} minutes`,
                        blockedUntil: user.blockedUntil
                    },
                    data: null
                });
                return;
            } else {
                // console.log("unblocking user")
                user.blockedUntil = undefined;
                await OTP.deleteOne({ _id: existingOTP?._id });
                await user.save();
            }
        }

        // Generate new OTP code
        const otpCode = generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

        if (!existingOTP) {
            // No existing OTP - create new one
            // console.log("no existing otp")
            await OTP.create({
                userId: user._id,
                code: otpCode,
                description: 'Account verification',
                expiredAt: otpExpiry,
                attempts: 1,
                lastOtpAttemptAt: new Date()
            });
        } else {
            // console.log("existing otp found: ", existingOTP)
            // Check if last request was more than 30 minutes ago
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

            if (existingOTP.lastOtpAttemptAt && existingOTP.lastOtpAttemptAt < thirtyMinutesAgo) {
                // console.log("otp requested long time ago")
                // Delete old OTP and create new one
                await OTP.deleteOne({ _id: existingOTP._id });
                await OTP.create({
                    userId: user._id,
                    code: otpCode,
                    description: 'Account verification',
                    expiredAt: otpExpiry,
                    attempts: 1,
                    lastOtpAttemptAt: new Date()
                });
            } else if (existingOTP.attempts < 3) {
                // Increment attempts and update OTP
                const incremetedOTP = await OTP.findByIdAndUpdate(existingOTP._id, {
                    code: otpCode,
                    expiredAt: otpExpiry,
                    $inc: { attempts: 1 },
                    lastOtpAttemptAt: new Date()
                });
                // console.log("incrementing otp count: ", incremetedOTP)
            } else {
                // Block user after 3 attempts
                const blockUntil = new Date();
                blockUntil.setMinutes(blockUntil.getMinutes() + 30);

                const blockedUser = await User.findByIdAndUpdate(user._id, {
                    blockedUntil: blockUntil,
                    enabled: false
                });

                // console.log("user blocked: ", blockedUser)

                await OTP.deleteOne({ _id: existingOTP._id });

                res.status(429).json({
                    success: false,
                    error: {
                        message: 'Too many attempts. Try again after 30 minutes',
                        blockedUntil: blockUntil
                    },
                    data: null
                });
                return;
            }
        }

        // Send OTP email
        await sendRegisterOTPEmail(user._id, email, otpCode);

        const currentOTP = await OTP.findOne({ userId: user._id });
        // console.log("current otp: ", currentOTP)

        res.status(200).json({
            success: true,
            data: {
                message: 'New OTP has been sent to your email',
                object: {
                    attemptsRemaining: 3 - currentOTP!.attempts,
                    expiresIn: '10 minutes'
                }
            },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error sending OTP: ' + errorMessage },
            data: null
        });
    }
});

authRouter.post("/google", async (req: Request, res: Response) => {
    const { token, currency } = req.body;

    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const googleUser = await googleRes.json();
    // console.log("googleUser: ", googleUser)
    const { email, given_name, picture } = googleUser;
    let existingUser = await User.findOne({ email });
    let isNewUser = false;
    if (!existingUser) {
        // console.log("creating new user...")
        existingUser = await User.create({
            email,
            username: given_name,
            password: null,
            currency: currency,
            enabled: true,
            blockedUntil: null,
        });

        // Initialize notification preferences
        await initializeUserNotificationPreferences(existingUser._id);

        // Subscribe starter plan by default
        const plan = await Plan.findOne({ name: PlanType.STARTER })
        const now = Date.now();
        await Subscription.create({
            userId: existingUser._id,
            planId: plan!._id,
            paymentId: null,
            startDate: now,
            endDate: now,
            lastBillingDate: now,
            nextBillingDate: now,
            status: SubscriptionStatus.ACTIVE,
            autoRenew: false
        });

        const space = await Space.create({
            ownerId: existingUser._id,
            type: SpaceType.CASH,
            isDefault: true,
            name: "cash in hand"
        })

        isNewUser = true;
    }

    // console.log("existing user found: ", existingUser)
    if (existingUser.blockedUntil && existingUser.blockedUntil > new Date()) {
        const remainingTime = existingUser.blockedUntil.getTime() - Date.now();
        const minutesRemaining = Math.ceil(remainingTime / (1000 * 60));
        res.status(429).json({
            success: false,
            error: null,
            data: {
                message: `Maximum login attempts reached. Please try again after ${minutesRemaining} minutes`,
                object: {
                    username: existingUser.username,
                    email: existingUser.email,
                    status: LoginStatus.BLOCKED
                }
            }
        });
        return;
    }
    if (!existingUser.enabled) {
        res.status(401).json({
            success: false,
            error: null,
            data: {
                message: 'Account not verified. Please verify your account first.',
                object: {
                    username: existingUser.username,
                    email: existingUser.email,
                    status: LoginStatus.VERIFICATION_REQUIRED
                }
            }
        });
        return;
    }
    const subscription = await Subscription.findOne({ userId: existingUser._id, status: SubscriptionStatus.ACTIVE });
    let plan = await Plan.findOne({ _id: subscription!.planId });
    if (plan!.name !== PlanType.STARTER && subscription!.endDate < new Date()) {
        plan = await Plan.findOne({ name: PlanType.STARTER })
    }
    const accessToken = generateAccessToken({ id: existingUser._id.toString(), role: existingUser.role })
    const refreshToken = generateRefreshToken({ id: existingUser._id.toString(), role: existingUser.role })
    existingUser.refreshToken = refreshToken
    const updatedUser = await User.findByIdAndUpdate(
        existingUser._id,
        { refreshToken },
        { new: true }
    ).select('-password');

    // console.log(updatedUser?.refreshToken)

    res.cookie('refreshToken', updatedUser!.refreshToken, {
        httpOnly: true,
        secure: false, // TODO: Use true in production with HTTPS
        sameSite: 'strict',
        path: '/user/auth/',
    });

    const spaces = await getSpacesByUser(existingUser._id.toString());

    res.status(200).json({
        success: true,
        data: {
            object: {
                _id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email,
                currency: existingUser.currency,
                plan: plan!.name,
                profileImgUrl: existingUser?.profileImgUrl,
                accessToken: accessToken,
                role: existingUser.role,
                spaces: spaces
            },
            message: isNewUser ? 'Select your currency' : 'Login successful'
        },
        error: null
    });

    if (isNewUser) {
        // Create welcome notification (sends both in-app and email)
        await createWelcomeNotification(existingUser._id.toString(), existingUser.username);
    }
    return;
})

authRouter.post("/facebook", async (req: Request, res: Response) => {
    const { token, currency } = req.body;

    const facebookRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`);
    const facebookUser = await facebookRes.json();
    
    if (facebookUser.error) {
        res.status(401).json({
            success: false,
            error: { message: 'Facebook authentication failed' },
            data: null
        });
        return;
    }

    const { email, name } = facebookUser;
    
    // Check if user already exists
    let existingUser = await User.findOne({ email });
    let isNewUser = false;

    if (!existingUser) {
        existingUser = await User.create({
            email,
            username: name,
            password: null, // Social logins don't have passwords
            currency: currency || null,
            enabled: true,
            blockedUntil: null,
        });

        // Initialize notification preferences
        await initializeUserNotificationPreferences(existingUser._id);

        // Default plan and subscription logic
        const plan = await Plan.findOne({ name: PlanType.STARTER });
        const now = Date.now();
        await Subscription.create({
            userId: existingUser._id,
            planId: plan!._id,
            paymentId: null,
            startDate: now,
            endDate: now,
            lastBillingDate: now,
            nextBillingDate: now,
            status: SubscriptionStatus.ACTIVE,
            autoRenew: false
        });

        await Space.create({
            ownerId: existingUser._id,
            type: SpaceType.CASH,
            isDefault: true,
            name: "cash in hand"
        });

        isNewUser = true;
    }

    if (existingUser.blockedUntil && existingUser.blockedUntil > new Date()) {
        const remainingTime = existingUser.blockedUntil.getTime() - Date.now();
        const minutesRemaining = Math.ceil(remainingTime / (1000 * 60));
        res.status(429).json({
            success: false,
            error: null,
            data: {
                message: `Maximum login attempts reached. Please try again after ${minutesRemaining} minutes`,
                object: {
                    username: existingUser.username,
                    email: existingUser.email,
                    status: LoginStatus.BLOCKED
                }
            }
        });
        return;
    }

    // Automatically enable account for social login if previously unverified
    if (!existingUser.enabled) {
        existingUser.enabled = true;
        await existingUser.save();
        
        // Ensure default space is created (usually done during OTP verification)
        const existingSpace = await Space.findOne({ ownerId: existingUser._id });
        if (!existingSpace) {
            await Space.create({
                ownerId: existingUser._id,
                type: SpaceType.CASH,
                isDefault: true,
                name: "cash in hand"
            });
        }
        
        isNewUser = true; 
    }

    const subscription = await Subscription.findOne({ userId: existingUser._id, status: SubscriptionStatus.ACTIVE });
    let plan = await Plan.findOne({ _id: subscription!.planId });
    if (plan!.name !== PlanType.STARTER && subscription!.endDate < new Date()) {
        plan = await Plan.findOne({ name: PlanType.STARTER });
    }

    const accessToken = generateAccessToken({ id: existingUser._id.toString(), role: existingUser.role });
    const refreshToken = generateRefreshToken({ id: existingUser._id.toString(), role: existingUser.role });
    
    existingUser.refreshToken = refreshToken;
    const updatedUser = await User.findByIdAndUpdate(
        existingUser._id,
        { refreshToken },
        { new: true }
    ).select('-password');

    res.cookie('refreshToken', updatedUser!.refreshToken, {
        httpOnly: true,
        secure: false, // Set to true in production
        sameSite: 'strict',
        path: '/user/auth/',
    });

    const spaces = await getSpacesByUser(existingUser._id.toString());

    res.status(200).json({
        success: true,
        data: {
            object: {
                _id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email,
                currency: existingUser.currency,
                plan: plan!.name,
                accessToken: accessToken,
                role: existingUser.role,
                spaces: spaces
            },
            message: isNewUser ? 'Select your currency' : 'Login successful'
        },
        error: null
    });

    if (isNewUser) {
        // Create welcome notification (sends both in-app and email)
        await createWelcomeNotification(existingUser._id.toString(), existingUser.username);
    }
    return;
});

authRouter.post("/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                error: null,
                data: {
                    message: 'No account assosiated with email ' + email + ".",
                    object: {
                        status: LoginStatus.INVALID_CREDENTIALS
                    }
                }
            });
            return;
        }

        if (user.blockedUntil && user.blockedUntil > new Date()) {
            const remainingTime = user.blockedUntil.getTime() - Date.now();
            const minutesRemaining = Math.ceil(remainingTime / (1000 * 60));
            res.status(429).json({
                success: false,
                error: null,
                data: {
                    message: `Maximum login attempts reached. Please try again after ${minutesRemaining} minutes`,
                    object: {
                        username: user.username,
                        email: user.email,
                        status: LoginStatus.BLOCKED
                    }
                }
            });
            return;
        }
        if (bcrypt.compareSync(password, user.password)) {
            if (!user.enabled) {
                res.status(401).json({
                    success: false,
                    error: null,
                    data: {
                        message: 'Your email not verified. Please verify your account first.',
                        object: {
                            username: user.username,
                            email: user.email,
                            status: LoginStatus.VERIFICATION_REQUIRED
                        }
                    }
                });
                return;
            }
            const subscription = await Subscription.findOne({ userId: user._id, status: SubscriptionStatus.ACTIVE });
            let plan = await Plan.findOne({ _id: subscription!.planId });
            if (plan!.name !== PlanType.STARTER && subscription!.endDate < new Date()) {
                plan = await Plan.findOne({ name: PlanType.STARTER })
            }
            const accessToken = generateAccessToken({ id: user._id.toString(), role: user.role })
            const refreshToken = generateRefreshToken({ id: user._id.toString(), role: user.role })
            user.refreshToken = refreshToken
            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                { refreshToken },
                { new: true }
            ).select('-password');

            // console.log(updatedUser?.refreshToken)

            res.cookie('refreshToken', updatedUser!.refreshToken, {
                httpOnly: true,
                secure: false, // TODO: Use true in production with HTTPS
                sameSite: 'strict',
                path: '/user/auth/',
            });

            const spaces = await getSpacesByUser(user._id.toString());

            res.status(200).json({
                success: true,
                data: {
                    object: {
                        _id: user._id,
                        username: user.username,
                        email: user.email,
                        currency: user.currency,
                        plan: plan!.name,
                        profileImgUrl: user?.profileImgUrl,
                        accessToken: accessToken,
                        role: user.role,
                        spaces: spaces
                    },
                    message: 'Login successful'
                },
                error: null
            });
            return;
        }
        res.status(401).json({
            success: false,
            error: null,
            data: {
                message: 'Invalid credentials',
                object: {
                    username: user.username,
                    email: user.email,
                    status: LoginStatus.INVALID_CREDENTIALS
                }
            }
        })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error while login: ' + errorMessage },
            data: null
        });
    }

});

// Refresh Token
authRouter.post('/refresh_token', async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;
    // console.log("req.cookies: ", req.cookies)
    if (!token) {
        console.log("[AUTH] Refresh token not found in cookies!");
        res.sendStatus(401);
        return;
    };
    
    console.log("[AUTH] Attempting refresh with token snippet:", token.substring(0, 10) + "...");
    const storedToken = await User.findOne({ refreshToken: token });
    if (!storedToken) {
        console.log("[AUTH] Refresh token not found in database for this value!");
        res.sendStatus(401);
        return;
    }

    jwt.verify(token, REFRESH_TOKEN_SECRET, async (err: any, user: any) => {
        if (err) {
            console.log("[AUTH] Refresh token verification failed:", err.message);
            return res.sendStatus(401)
        };
        console.log("[AUTH] Refresh token valid for user ID:", user.id);
        const storedUser = await User.findOne({ _id: user.id });
        if (!storedUser || !storedUser.enabled) {
            return res.status(401).send("no user found or disbaled")
        }
        // console.log("stored user: ", storedUser)
        const subscription = await Subscription.findOne({ userId: user.id, status: SubscriptionStatus.ACTIVE });
        let plan = await Plan.findOne({ _id: subscription!.planId });
        if (plan!.name !== PlanType.STARTER && subscription!.endDate < new Date()) {
            plan = await Plan.findOne({ name: PlanType.STARTER })
        }
        const newAccessToken = generateAccessToken({ id: storedUser._id.toString(), role: user.role });

        const spaces = await getSpacesByUser(storedUser._id.toString());

        res.status(200).json({
            success: true,
            data: {
                object: {
                    _id: storedUser._id,
                    username: storedUser.username,
                    email: storedUser.email,
                    currency: storedUser.currency,
                    plan: plan!.name,
                    profileImgUrl: storedUser?.profileImgUrl,
                    accessToken: newAccessToken,
                    role: storedUser.role,
                    spaces: spaces
                },
                message: 'Refresh successful'
            },
            error: null
        });
        return;
    });
})

// Logout
authRouter.post('/logout', async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    const user = await User.findOne(
        { refreshToken },
        { new: true }
    ).select('-password');
    if (user) {
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { refreshToken: "" },
            { new: true }
        ).select('-password');
        // console.log("updated logout user: ", updatedUser)
    }
    res.clearCookie('refreshToken');
    res.sendStatus(204);
})

// Protected Route Test
authRouter.get('/protected', authenticate, (req: Request, res: Response) => {
    // console.log("protected route. user: ", (req as any).user)
    res.json({ message: 'This is protected data' });
});

export default authRouter;


const getSpacesByUser = async (userId: string) => {
    const userObjectId = new Types.ObjectId(userId);

    const spaces = await Space.find({
        $or: [
            // owner always has access
            { ownerId: userObjectId },

            // collaborator must be enabled
            {
                collaborators: {
                    $elemMatch: {
                        userId: userObjectId,
                        status: COLLABORATOR_STATUS.ACCEPTED
                    }
                }
            }
        ]
    })
        .select({
            _id: 1,
            type: 1,
            name: 1,
            isCollaborative: 1,
            ownerId: 1
        })
        .lean();

    const response = spaces.map(space => ({
        id: space._id,
        type: space.type,
        name: space.name,
        isCollaborative: space.isCollaborative ?? false,
        isOwner: space.ownerId.toString() === userId
    }));
    return response;
}
