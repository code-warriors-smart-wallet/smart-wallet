import express, { Request, Response } from 'express';
import Cat from '../models/category';
import Space from '../models/space';
import { authenticate } from '../middlewares/auth';
import mongoose from 'mongoose';
import { getUsersBySpace } from './transaction';

const categoryRouter = express.Router();

categoryRouter.post('/sub', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { parentCategoryId, subCategoryName, subCategorycolor, transactionType } = req.body;

        const category = {
            name: subCategoryName,
            color: subCategorycolor,
            transactionTypes: [transactionType],
            userId: userId
        }

        const updatedCategory = await Cat.findByIdAndUpdate(
            parentCategoryId,
            { $push: { subCategories: category } },
            { new: true }
        );

        if (!updatedCategory) {
            res.status(404).json({
                success: false,
                error: { message: 'Category not Found' },
                data: null
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                object: updatedCategory,
                message: 'Categories created successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating sub category: ' + errorMessage },
            data: null
        });
    }
})

categoryRouter.post('/main', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { spaces, parentCategory, color, subCategories } = req.body;
        const newSubCategories = subCategories.map((cat: any) => ({
            name: cat.subCategoryName,
            color: cat.subCategorycolor,
            transactionTypes: cat.transactionTypes,
            userId: userId
        }));

        const newMainCategory = {
            spaces: spaces,
            parentCategory: parentCategory,
            color: color,
            subCategories: newSubCategories
        }

        const category = await Cat.create(newMainCategory);

        res.status(200).json({
            success: true,
            data: {
                object: category,
                message: 'Category created successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating main category: ' + errorMessage },
            data: null
        });
    }
})

categoryRouter.put('/sub/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const {
            oldParentCategoryId,
            newParentCategoryId,
            subCategoryId,
            name,
            color,
            transactionTypes,
        } = req.body;

        // Find the old subcategory (so you can keep other fields intact)
        const oldParent = await Cat.findOne({
            _id: oldParentCategoryId,
            "subCategories._id": subCategoryId,
            "subCategories.userId": userId
        });

        if (!oldParent) {
            res.status(404).json({ message: "Old parent or subcategory not found" });
        }


        // Remove from old parent
        await Cat.findByIdAndUpdate(oldParentCategoryId, {
            $pull: { subCategories: { _id: subCategoryId } }
        });

        // Push into new parent with updated data
        const updatedCategory = await Cat.findByIdAndUpdate(
            newParentCategoryId,
            {
                $push: {
                    subCategories: {
                        name: name,
                        color: color,
                        transactionTypes: transactionTypes,
                        userId: userId
                    }
                }
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: {
                object: updatedCategory,
                message: 'Category updtated successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating sub category: ' + errorMessage },
            data: null
        });
    }
})

categoryRouter.delete('/sub/:pid/:sid', authenticate, async (req: Request, res: Response) => {
    try {
        const { pid, sid } = req.params;
        const userId: string = (req as any).user.id;

        // Find the old subcategory (so you can keep other fields intact)
        const oldParent = await Cat.findOne({
            _id: pid,
            "subCategories._id": sid,
            "subCategories.userId": userId
        });

        if (!oldParent) {
            res.status(404).json({ message: "Old parent or subcategory not found" });
        }


        // Remove from old parent
        await Cat.findByIdAndUpdate(pid, {
            $pull: { subCategories: { _id: sid } }
        });

        res.status(200).json({
            success: true,
            data: {
                message: 'Category deleted successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating sub category: ' + errorMessage },
            data: null
        });
    }
})

categoryRouter.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;

        const categories = await Cat.aggregate([
            { $unwind: "$subCategories" },

            {
                $match: {
                    $or: [
                        { "subCategories.userId": null },
                        { "subCategories.userId": new mongoose.Types.ObjectId(userId) }
                    ]
                }
            },

            {
                $project: {
                    parentCategoryId: "$_id",
                    parentCategory: 1,
                    spaces: 1,
                    subCategoryId: "$subCategories._id",
                    subCategoryName: "$subCategories.name",
                    transactionTypes: "$subCategories.transactionTypes",
                    subCategoryColor: "$subCategories.color",
                    userId: "$subCategories.userId",
                    color: 1,
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                object: categories,
                message: 'Categories retrived successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error finding categories: ' + errorMessage },
            data: null
        });
    }
})

categoryRouter.get('/space/:spaceid', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { spaceid } = req.params;

        const space = await Space.findById(spaceid)
        const userIds = await getUsersBySpace(spaceid);

        const categories = await Cat.aggregate([
            { $match: { spaces: space?.type } },

            { $unwind: "$subCategories" },

            {
                $match: {
                    $or: [
                        { "subCategories.userId": null },
                        { "subCategories.userId": { $in: userIds } }
                    ]
                }
            },

            {
                $lookup: {
                    from: "users", // MongoDB collection name
                    localField: "subCategories.userId",
                    foreignField: "_id",
                    as: "user"
                }
            },

            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $project: {
                    parentCategoryId: "$_id",
                    parentCategory: 1,
                    spaces: 1,
                    color: 1,
                    subCategoryId: "$subCategories._id",
                    subCategoryName: "$subCategories.name",
                    transactionTypes: "$subCategories.transactionTypes",
                    subCategoryColor: "$subCategories.color",
                    user: {
                        _id: "$user._id",
                        username: "$user.username"
                    }
                }
            },

            {
                $sort: {
                    parentCategory: 1,
                    subCategoryName: 1
                }
            }
        ]);


        res.status(200).json({
            success: true,
            data: {
                object: categories,
                message: 'Categories retrived successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error finding categories: ' + errorMessage },
            data: null
        });
    }
})

export default categoryRouter;
