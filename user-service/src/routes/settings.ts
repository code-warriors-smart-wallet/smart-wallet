import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/user';
import { authenticate } from '../middlewares/auth';
import Plan, { PlanType } from '../models/plan';
import Subscription, { SubscriptionStatus } from '../models/subscription';
import { Types } from 'mongoose';
import Space, { SpaceType, COLLABORATOR_STATUS } from '../models/space';

const settingsRouter = express.Router();

// Helper functions (Refactored to shared location in this file)
async function getSpacesByUser(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const spaces = await Space.find({
        $or: [
            { ownerId: userObjectId },
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
    .select({ _id: 1, type: 1, name: 1, isCollaborative: 1, ownerId: 1 })
    .lean();

    return spaces.map(space => ({
        id: space._id,
        type: space.type,
        name: space.name,
        isCollaborative: space.isCollaborative ?? false,
        isOwner: space.ownerId.toString() === userId
    }));
}

async function buildUserProfile(user: any) {
    const subscription = await Subscription.findOne({ userId: user._id, status: SubscriptionStatus.ACTIVE });
    let planName = PlanType.STARTER;
    
    if (subscription) {
        const plan = await Plan.findById(subscription.planId);
        if (plan) {
            if (plan.name !== PlanType.STARTER && subscription.endDate < new Date()) {
                planName = PlanType.STARTER;
            } else {
                planName = plan.name;
            }
        }
    }

    const spaces = await getSpacesByUser(user._id.toString());

    return {
        username: user.username,
        email: user.email,
        currency: user.currency,
        theme: user.theme,
        profileImgUrl: user.profileImgUrl,
        plan: planName,
        role: user.role,
        spaces: spaces
    };
}

// Get current user profile
settingsRouter.get('/me', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found' },
                data: null
            });
            return;
        }

        const profile = await buildUserProfile(user);

        res.status(200).json({
            success: true,
            data: {
                object: profile,
                message: 'Profile fetched successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error fetching profile: ' + errorMessage },
            data: null
        });
    }
});

// Update profile details (currency, theme, profileImgUrl)
settingsRouter.put('/update-profile', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { currency, theme, profileImgUrl } = req.body;

        const updateData: any = {};
        if (currency) updateData.currency = currency;
        if (theme) updateData.theme = theme;
        if (profileImgUrl !== undefined) updateData.profileImgUrl = profileImgUrl;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found' },
                data: null
            });
            return;
        }

        // Return the full profile response (including calculated fields like spaces/plan)
        const profile = await buildUserProfile(updatedUser);

        res.status(200).json({
            success: true,
            data: {
                object: profile,
                message: 'Profile updated successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error updating profile: ' + errorMessage },
            data: null
        });
    }
});

// Change password
settingsRouter.put('/change-password', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found' },
                data: null
            });
            return;
        }

        // Verify current password
        if (user.password && !bcrypt.compareSync(currentPassword, user.password)) {
            res.status(400).json({
                success: false,
                error: { message: 'Incorrect current password' },
                data: null
            });
            return;
        }

        // Hash and save new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                message: 'Password changed successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error changing password: ' + errorMessage },
            data: null
        });
    }
});

export default settingsRouter;
