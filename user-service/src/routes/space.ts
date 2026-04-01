import express, { Request, Response } from 'express';
import Space, { SpaceType, COLLABORATOR_STATUS } from '../models/space';
import Transaction from '../models/transaction';
import Cat from '../models/category';
import User from '../models/user';
import { authenticate } from '../middlewares/auth';
import { TransactionType } from '../models/transaction';
import { createInvitationToken } from '../utils/space.util';
import { sendSpaceInvitationEmail } from '../services/email.service';
import { updateTransactionMemberStatus } from '../services/transaction.service';
import dotenv from 'dotenv';
import { Types } from 'mongoose';
import { updateScheduleMemberStatus } from '../services/schedule.service';

dotenv.config();
const FRONTEND_URL = process.env.FRONTEND_URL;

const spaceRouter = express.Router();

spaceRouter.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        let spaceModal: any = null

        if (req.body.type == SpaceType.CREDIT_CARD) {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
                creditCardLimit: req.body.creditCardLimit,
                creditCardStatementDate: req.body.statementDate,
                creditCardDueDate: req.body.dueDate,
            }
        } else if (req.body.type == SpaceType.LOAN_BORROWED || req.body.type == SpaceType.LOAN_LENT) {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
                loanPrincipal: req.body.loanPrincipal,
                loanStartDate: req.body.loanStartDate,
                loanEndDate: req.body.loanEndDate
            }
        } else if (req.body.type == SpaceType.SAVING_GOAL) {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
                targetAmount: req.body.targetAmount,
                desiredDate: req.body.desiredDate,
            }
        } else {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
            }
        }

        const collaborators: any[] = []
        if (req.body.isCollaborative) {
            spaceModal.isCollaborative = true;

            for (const email of req.body.collaborators) {
                const existingUser = await User.findOne({ email });

                if (!existingUser) {
                    return res.status(404).json({
                        success: false,
                        error: { message: 'User with this email not exists: ' + email },
                        data: null
                    });
                }

                const token = createInvitationToken();
                const invitationLink = `${FRONTEND_URL}/invite?token=${token}`;
                const emailStatus = await sendSpaceInvitationEmail(
                    existingUser._id,
                    email,
                    req.body.name,
                    invitationLink
                );

                console.log(">>> emailStatus: ", emailStatus)

                collaborators.push({
                    userId: existingUser._id,
                    invitationLink,
                    expiredAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
                    status: COLLABORATOR_STATUS.PENDING
                });
            }

            console.log(collaborators.length);
            spaceModal.collaborators = collaborators;
        }

        const space = await Space.create(spaceModal)
        const today = new Date()

        if (req.body.type == SpaceType.LOAN_BORROWED) {
            const scategories = await Cat.aggregate([
                { $match: { spaces: SpaceType.LOAN_BORROWED } },

                { $unwind: "$subCategories" },

                {
                    $project: {
                        parentCategoryId: "$_id",
                        parentCategory: 1,
                        subCategoryId: "$subCategories._id",
                        subCategoryName: "$subCategories.name",
                        transactionTypes: "$subCategories.transactionTypes"
                    }
                }
            ]);

            const scategory = scategories.find(cat => cat.transactionTypes.includes(TransactionType.LOAN_PRINCIPAL))

            let transaction = {
                type: TransactionType.LOAN_PRINCIPAL,
                amount: req.body.loanPrincipal,
                to: req.body.to,
                from: space._id,
                date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                note: "",
                pcategory: scategory?.parentCategoryId,
                scategory: scategory?.subCategoryId,
                userId: userId,
                spaceId: space._id,
            }
            await Transaction.create(transaction)
        } else if (req.body.type == SpaceType.LOAN_LENT) {
            const scategories = await Cat.aggregate([
                { $match: { spaces: SpaceType.LOAN_LENT } },

                { $unwind: "$subCategories" },

                {
                    $project: {
                        parentCategoryId: "$_id",
                        parentCategory: 1,
                        subCategoryId: "$subCategories._id",
                        subCategoryName: "$subCategories.name",
                        transactionTypes: "$subCategories.transactionTypes"
                    }
                }
            ]);

            const scategory = scategories.find(cat => cat.transactionTypes.includes(TransactionType.LOAN_PRINCIPAL))
            let transaction = {
                type: TransactionType.LOAN_PRINCIPAL,
                amount: req.body.loanPrincipal,
                from: req.body.from,
                to: space._id,
                date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                note: "",
                pcategory: scategory?.parentCategoryId,
                scategory: scategory?.subCategoryId,
                userId: userId,
                spaceId: space._id,
            }
            await Transaction.create(transaction)
        } else if (req.body.type == SpaceType.SAVING_GOAL) {
            const scategories = await Cat.aggregate([
                { $match: { spaces: SpaceType.SAVING_GOAL } },

                { $unwind: "$subCategories" },

                {
                    $project: {
                        parentCategoryId: "$_id",
                        parentCategory: 1,
                        subCategoryId: "$subCategories._id",
                        subCategoryName: "$subCategories.name",
                        transactionTypes: "$subCategories.transactionTypes"
                    }
                }
            ]);

            const scategory = scategories.find(cat => cat.transactionTypes.includes(TransactionType.SAVING))
            let transaction = {
                type: TransactionType.SAVING,
                amount: req.body.savedAlready,
                from: req.body.from,
                to: space._id,
                date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                note: "",
                pcategory: scategory?.parentCategoryId,
                scategory: scategory?.subCategoryId,
                userId: userId,
                spaceId: space._id,
            }
            await Transaction.create(transaction)
        }

        const spaces = await Space.find(
            {
                $or: [
                    { ownerId: userId },
                    {
                        isCollaborative: true,
                        collaborators: {
                            $elemMatch: {
                                userId: userId,
                                enabled: true,
                            }
                        }
                    }
                ]
            },
            { name: 1, type: 1 }
        )

        res.status(201).json({
            success: true,
            data: {
                object: spaces,
                message: 'Space created successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating space: ' + errorMessage },
            data: null
        });
    }

})

spaceRouter.get('/invite/info/:token', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { token } = req.params;
        const invitationLink = `${FRONTEND_URL}/invite?token=${token}`;
        const space = await Space.findOne({
            collaborators: {
                $elemMatch: {
                    userId: new Types.ObjectId(userId),
                    invitationLink: invitationLink,
                }
            }
        })
            .populate({
                path: "ownerId",
                select: "email -_id"
            })
            .lean();

        if (!space) {
            res.status(404).json({ message: "Space not found" });
        }
        const collaborator = space?.collaborators.find(col => col.invitationLink == invitationLink);

        if (space && collaborator && (collaborator.expiredAt as unknown as Date).getTime() < Date.now()) {
            await Space.updateOne(
                { _id: space._id, "collaborators.invitationLink": invitationLink },
                { $set: { "collaborators.$.status": COLLABORATOR_STATUS.EXPIRED } }
            );
        }

        res.status(201).json({
            success: true,
            data: {
                object: {
                    id: space?._id,
                    type: space?.type,
                    owner: space?.ownerId,
                    spaceName: space?.name,
                    status: collaborator?.status
                },
                message: 'Invitation info fetched!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error validating invitation: ' + errorMessage },
            data: null
        });
    }
})

spaceRouter.put('/invite/accept/:token', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { token } = req.params;
        const invitationLink = `${FRONTEND_URL}/invite?token=${token}`;
        const space = await Space.findOne({
            "collaborators.invitationLink": invitationLink,
        });

        if (!space) {
            res.status(404).json({ message: "Space not found" });
        }

        const collaborator = space?.collaborators.find(col => col.invitationLink == invitationLink);
        if (userId != (collaborator as any).userId) {
            res.status(403).json({ success: false, data: { message: "Unauthorized" } });
        }
        if (space && collaborator && (collaborator.expiredAt as unknown as Date).getTime() >= Date.now()) {
            collaborator.status = COLLABORATOR_STATUS.ACCEPTED;
            await Space.updateOne({ _id: space._id }, { $set: space })
        } else if (space && collaborator && (collaborator.expiredAt as unknown as Date).getTime() < Date.now()) {
            res.status(400).json({ success: false, data: { message: "Invitation Link expired" } });
        }
        res.status(201).json({
            success: true,
            data: {
                object: {
                    id: space?._id,
                    type: space?.type
                },
                message: 'Invitation accepted'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error validating invitation: ' + errorMessage },
            data: null
        });
    }
})

spaceRouter.put('/invite/reject/:token', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { token } = req.params;
        const invitationLink = `${FRONTEND_URL}/invite?token=${token}`;
        const space = await Space.findOne({
            "collaborators.invitationLink": invitationLink,
        });

        if (!space) {
            res.status(404).json({ message: "Space not found" });
        }

        const collaborator = space?.collaborators.find(col => col.invitationLink == invitationLink);
        if (userId != (collaborator as any).userId) {
            res.status(403).json({ success: false, data: { message: "Unauthorized" } });
        }
        if (space && collaborator && (collaborator.expiredAt as unknown as Date).getTime() > Date.now()) {
            collaborator.status = COLLABORATOR_STATUS.REJECTED;
            await Space.updateOne({ _id: space._id }, { $set: space })
        } else {
            res.status(400).json({ success: false, data: { message: "Link expired" } });
        }
        res.status(201).json({
            success: true,
            data: {
                object: {
                    id: space?._id,
                    type: space?.type
                },
                message: 'Invitation rejected'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error validating invitation: ' + errorMessage },
            data: null
        });
    }
})

spaceRouter.get('/exists/:email', authenticate, async (req: Request, res: Response) => {
    try {
        const { email } = req.params;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            res.status(200).json({
                success: true,
                data: true
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: false
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error checking existance: ' + errorMessage },
            data: null
        });
    }
})

spaceRouter.put('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;
        let spaceModal: any = null

        const existingSpace = await Space.findOne({ _id: id, ownerId: userId });
        if (!existingSpace) {
            res.status(404).json({
                success: false,
                error: { message: 'Space not Found' },
                data: null
            });
            return;
        }

        if (req.body.type == SpaceType.CREDIT_CARD) {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
                creditCardLimit: req.body.creditCardLimit,
                creditCardStatementDate: req.body.statementDate,
                creditCardDueDate: req.body.dueDate,
            }
        } else if (req.body.type == SpaceType.LOAN_BORROWED || req.body.type == SpaceType.LOAN_LENT) {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
                loanPrincipal: req.body.loanPrincipal,
                loanStartDate: req.body.loanStartDate,
                loanEndDate: req.body.loanEndDate
            }
        } else if (req.body.type == SpaceType.SAVING_GOAL) {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
                targetAmount: req.body.targetAmount,
                desiredDate: req.body.desiredDate,
            }
        } else {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
            }
        }

        await Space.updateOne({ _id: id }, { $set: spaceModal })
        const today = new Date()

        if (req.body.type == SpaceType.LOAN_BORROWED) {
            const scategories = await Cat.aggregate([
                { $match: { spaces: SpaceType.LOAN_BORROWED } },

                { $unwind: "$subCategories" },

                {
                    $project: {
                        parentCategoryId: "$_id",
                        parentCategory: 1,
                        subCategoryId: "$subCategories._id",
                        subCategoryName: "$subCategories.name",
                        transactionTypes: "$subCategories.transactionTypes"
                    }
                }
            ]);

            const scategory = scategories.find(cat => cat.transactionTypes.includes(TransactionType.LOAN_PRINCIPAL))

            const existingTransaction = await Transaction.findOne({
                from: id,
                type: TransactionType.LOAN_PRINCIPAL
            })

            if (!existingTransaction) {
                res.status(404).json({
                    success: false,
                    error: { message: 'Transaction not Found' },
                    data: null
                });
                return;
            }

            let transaction = {
                type: TransactionType.LOAN_PRINCIPAL,
                amount: req.body.loanPrincipal,
                to: req.body.to,
                from: id,
                date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                note: "",
                pcategory: scategory?.parentCategoryId,
                scategory: scategory?.subCategoryId,
                userId: userId,
                spaceId: req.body.spaceId,
            }

            await Transaction.updateOne({ _id: existingTransaction._id }, { $set: transaction })
        } else if (req.body.type == SpaceType.LOAN_LENT) {
            const scategories = await Cat.aggregate([
                { $match: { spaces: SpaceType.LOAN_LENT } },

                { $unwind: "$subCategories" },

                {
                    $project: {
                        parentCategoryId: "$_id",
                        parentCategory: 1,
                        subCategoryId: "$subCategories._id",
                        subCategoryName: "$subCategories.name",
                        transactionTypes: "$subCategories.transactionTypes"
                    }
                }
            ]);

            const scategory = scategories.find(cat => cat.transactionTypes.includes(TransactionType.LOAN_PRINCIPAL))

            const existingTransaction = await Transaction.findOne({
                to: id,
                type: TransactionType.LOAN_PRINCIPAL
            })

            if (!existingTransaction) {
                res.status(404).json({
                    success: false,
                    error: { message: 'Transaction not Found' },
                    data: null
                });
                return;
            }

            let transaction = {
                type: TransactionType.LOAN_PRINCIPAL,
                amount: req.body.loanPrincipal,
                from: req.body.from,
                to: id,
                date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                note: "",
                pcategory: scategory?.parentCategoryId,
                scategory: scategory?.subCategoryId,
                userId: userId,
                spaceId: req.body.spaceId,
            }
            await Transaction.updateOne({ _id: existingTransaction._id }, { $set: transaction })
        }

        const spaces = await Space.find({
            $or: [
                { ownerId: userId },
                {
                    isCollaborative: true,
                    collaborators: {
                        $elemMatch: {
                            userId: userId,
                            enabled: true,
                        }
                    }
                }
            ]
        },
            { name: 1, type: 1 }
        )

        res.status(201).json({
            success: true,
            data: {
                object: spaces,
                message: 'Space edited successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error editing space: ' + errorMessage },
            data: null
        });
    }

})

spaceRouter.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;

        const existingSpace = Space.findOne({ _id: id, ownerId: userId });
        if (!existingSpace) {
            res.status(404).json({
                success: false,
                error: { message: 'Space not Found' },
                data: null
            });
            return;
        }

        await Transaction.deleteMany({
            $and: [
                { userId: userId },
                {
                    $or: [
                        { from: id },
                        { to: id }
                    ]
                }
            ]
        })

        await Space.deleteOne({ _id: id })
        res.status(200).json({
            success: true,
            data: {
                message: 'Space deleted successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error deleting space: ' + errorMessage },
            data: null
        });
    }

})

spaceRouter.get('/user', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const spaces = await Space.find(
            {
                $or: [
                    { ownerId: userId },
                    {
                        isCollaborative: true,
                        collaborators: {
                            $elemMatch: {
                                userId: userId,
                                enabled: true,
                            }
                        }
                    }
                ]
            },
        )
        res.status(200).json({
            success: true,
            data: {
                object: spaces,
                message: 'Space retrived successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error finding spaces: ' + errorMessage },
            data: null
        });
    }
})

spaceRouter.post('/col/add', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { spaceId, email } = req.body;

        if (!spaceId || !email) {
            return res.status(400).json({
                success: false,
                error: { message: "spaceId and email are required" },
                data: null
            });
        }

        // Fetch user & space parallel (faster)
        const [existingUser, existingSpace] = await Promise.all([
            User.findOne({ email }),
            Space.findOne({ _id: spaceId, ownerId: userId })
        ]);

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: { message: `User not found: ${email}` },
                data: null,
            });
        }

        if (!existingSpace) {
            return res.status(404).json({
                success: false,
                error: { message: "Space not found or unauthorized" },
                data: null
            });
        }

        // Already collaborator?
        const alreadyAdded = existingSpace.collaborators.find(
            col => col.userId.toString() === existingUser._id.toString()
        );

        if (alreadyAdded && !(alreadyAdded.status === COLLABORATOR_STATUS.LEFT || COLLABORATOR_STATUS.REMOVED)) {
            return res.status(400).json({
                success: false,
                error: { message: `User already exists: ${email}` },
                data: null
            });
        }

        const token = createInvitationToken();
        const invitationLink = `${FRONTEND_URL}/invite?token=${token}`;

        await sendSpaceInvitationEmail(
            existingUser._id,
            email,
            existingSpace.name,
            invitationLink
        );

        if (alreadyAdded && (alreadyAdded.status === COLLABORATOR_STATUS.LEFT || COLLABORATOR_STATUS.REMOVED)) {
            alreadyAdded.status = COLLABORATOR_STATUS.PENDING
            alreadyAdded.expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000),
            alreadyAdded.invitationLink = invitationLink
        } else {
            const collaborator = {
                userId: existingUser._id,
                invitationLink,
                expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                status: COLLABORATOR_STATUS.PENDING
            };

            // Push new collaborator safely
            existingSpace.collaborators.push(collaborator);
        }
        await existingSpace.save();

        return res.status(201).json({
            success: true,
            data: {
                object: existingSpace,
                message: "User added successfully"
            },
            error: null
        });

    } catch (error) {
        console.error("Add collaborator error:", error);

        return res.status(500).json({
            success: false,
            error: { message: "Server error: " + (error instanceof Error ? error.message : "Unknown") },
            data: null
        });
    }
});

spaceRouter.delete('/col/remove', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { spaceId, email } = req.body;

        if (!spaceId || !email) {
            return res.status(400).json({
                success: false,
                error: { message: "spaceId and email are required" },
                data: null
            });
        }

        // Fetch space that belongs to the owner
        const existingSpace = await Space.findOne({ _id: spaceId, ownerId: userId });

        if (!existingSpace) {
            return res.status(404).json({
                success: false,
                error: { message: "Space not found or unauthorized" },
                data: null
            });
        }

        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: { message: `User not found: ${email}` },
                data: null,
            });
        }

        const collaborator = existingSpace.collaborators.find(
            col => col.userId.toString() === existingUser._id.toString()
        );

        if (existingSpace && collaborator) {
            collaborator.status = COLLABORATOR_STATUS.REMOVED;
            await Space.updateOne({ _id: existingSpace._id }, { $set: existingSpace })
        }

        await updateTransactionMemberStatus(
            spaceId, existingUser._id.toString(), "REMOVED_MEMBER"
        );

        await updateScheduleMemberStatus(
            spaceId, existingUser._id.toString(), "REMOVED_MEMBER"
        );

        return res.status(200).json({
            success: true,
            data: {
                object: existingSpace,
                message: "Collaborator removed successfully"
            },
            error: null
        });

    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({
            success: false,
            error: { message: "Error removing collaborator: " + msg },
            data: null
        });
    }
});

spaceRouter.delete('/col/left', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { spaceId } = req.body;

        if (!spaceId) {
            return res.status(400).json({
                success: false,
                error: { message: "spaceId is required" },
                data: null
            });
        }

        const existingSpace = await Space.findOne({ _id: spaceId });

        if (!existingSpace) {
            return res.status(404).json({
                success: false,
                error: { message: "Space not found or unauthorized" },
                data: null
            });
        }

        const existingUser = await User.findOne({ _id: userId });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: { message: `User not found.` },
                data: null,
            });
        }

        const collaborator = existingSpace.collaborators.find(
            col => col.userId.toString() === existingUser._id.toString()
        );

        if (existingSpace && collaborator) {
            collaborator.status = COLLABORATOR_STATUS.LEFT;
            await Space.updateOne({ _id: existingSpace._id }, { $set: existingSpace })
        }

        await updateTransactionMemberStatus(
            spaceId, existingUser._id.toString(), "LEFT_MEMBER"
        );

        await updateScheduleMemberStatus(
            spaceId, existingUser._id.toString(), "LEFT_MEMBER"
        );

        return res.status(200).json({
            success: true,
            data: {
                object: existingSpace,
                message: "Collaborator left successfully"
            },
            error: null
        });

    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({
            success: false,
            error: { message: "Error removing collaborator: " + msg },
            data: null
        });
    }
});

export default spaceRouter;
