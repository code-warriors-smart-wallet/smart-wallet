import { Schema, model, Document, Types } from 'mongoose';
import { TransactionType } from './transaction';
import { SpaceType } from './space';

const { ObjectId } = Types;

interface ISubCategory {
   _id: Schema.Types.ObjectId;
  name: string;
  color: string;
  transactionTypes: TransactionType[],
  userId?: Schema.Types.ObjectId | null;
}

export interface ICategory extends Document {
  parentCategory: string;
  subCategories: ISubCategory[];
  spaces: SpaceType[]
  color: string,
}

const SubCategorySchema = new Schema<ISubCategory>({
  name: { type: String, required: true },
  color: { type: String, required: true },
  transactionTypes: { type: [String], default: [] },
  userId: {type: Schema.Types.ObjectId, ref: "User", default: null}
});

const CategorySchema = new Schema<ICategory>({
  parentCategory: { type: String, required: true },
  subCategories: { type: [SubCategorySchema], default: [] },
  spaces: {type: [String]},
  color: { type: String, required: true }
}, {
  timestamps: true
});

const Cat = model<ICategory>('Cat', CategorySchema);

export default Cat;


// Sample category data
const categories: any = [
    {
        "_id": new ObjectId("68c8d8d5dfe13cdc534c9f09"),
        "parentCategory": "Loan Lent",
        "subCategories": [
            {
                "name": "Principal",
                "color": "#6b32a8",
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f0a"),
                "transactionTypes": [
                    "LOAN_PRINCIPAL"
                ]
            },
            {
                "name": "Interest Received",
                "color": "#32a89c",
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f0b"),
                "transactionTypes": [
                    "INTEREST_RECEIVED"
                ]
            },
            {
                "name": "Repayment Received",
                "color": "#a86532",
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f0c"),
                "transactionTypes": [
                    "PRINCIPAL_REPAYMENT_RECEIVED"
                ]
            }
        ],
        "color": "#6b32a8",
        "spaces": [
            "LOAN_LENT"
        ]
    },
    {
        "parentCategory": "Loan Borrowed",
        "subCategories": [
            {
                "name": "Principal",
                "color": "#6b32a8",
                "transactionTypes": [
                    "LOAN_PRINCIPAL"
                ]
            },
            {
                "name": "Interest Paid",
                "color": "#32a89c",
                "transactionTypes": [
                    "INTEREST_PAID"
                ]
            },
            {
                "name": "Repayment Paid",
                "color": "#a86532",
                "transactionTypes": [
                    "PRINCIPAL_REPAYMENT_PAID"
                ]
            }
        ],
        "color": "#a8326d",
        "spaces": [
            "LOAN_BORROWED"
        ]
    },
    {
        "parentCategory": "Credit Card",
        "subCategories": [
            {
                "name": "Bill Payment",
                "color": "#32a89c",
                "transactionTypes": [
                    "BILL_PAYMENT"
                ]
            },
            {
                "name": "Interest Charged",
                "color": "#a86532",
                "transactionTypes": [
                    "INTEREST_CHARGED"
                ]
            },
            {
                "name": "Refund",
                "color": "#FF5733",
                "transactionTypes": [
                    "REFUND"
                ]
            }
        ],
        "color": "#a8326d",
        "spaces": [
            "CREDIT_CARD"
        ]
    },
    {
        "_id": new ObjectId("68c8d8d5dfe13cdc534c9efe"),
        "parentCategory": "Miscellaneous",
        "subCategories": [
            {
                "name": "fee & charge",
                "color": "#FF9800",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9eff")
            },
            {
                "name": "tax",
                "color": "#E91E63",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f00")
            },
            {
                "name": "bills",
                "color": "#03A9F4",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f01")
            },
            {
                "name": "interest",
                "color": "#4CAF50",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f02")
            },
            {
                "name": "donations",
                "color": "#9C27B0",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f03")
            },
            {
                "name": "fines & penalties",
                "color": "#F44336",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f04")
            },
            {
                "name": "subscriptions",
                "color": "#00BCD4",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f05")
            },
            {
                "name": "gifts",
                "color": "#FFC107",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f06")
            },
            {
                "name": "transfer",
                "color": "#8BC34A",
                "transactionTypes": [
                    "INTERNAL_TRANSFER"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f08")
            }
        ],
        "color": "#FF9800",
        "spaces": [
            "CASH",
            "BANK",
            "CREDIT_CARD"
        ]
    },
    {
        "_id": new ObjectId("68c8d8d5dfe13cdc534c9f0d"),
        "parentCategory": "Food & Drinks",
        "subCategories": [
            {
                "name": "Groceries",
                "color": "#FF5733",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f0e")
            },
            {
                "name": "Restaurants",
                "color": "#33FF57",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f0f")
            },
            {
                "name": "Coffee & Tea",
                "color": "#3357FF",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f10")
            }
        ],
        "color": "#FF5733",
        "spaces": [
            "CASH",
            "BANK",
            "CREDIT_CARD"
        ]
    },
    {
        "_id": new ObjectId("68c8d8d5dfe13cdc534c9f11"),
        "parentCategory": "Shopping",
        "subCategories": [
            {
                "name": "Clothing",
                "color": "#FF33A8",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f12")
            },
            {
                "name": "Electronics",
                "color": "#33FFF6",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f13")
            },
            {
                "name": "Accessories",
                "color": "#F6FF33",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f14")
            }
        ],
        "color": "#FF33A8",
        "spaces": [
            "CASH",
            "BANK",
            "CREDIT_CARD"
        ]
    },
    {
        "_id": new ObjectId("68c8d8d5dfe13cdc534c9f15"),
        "parentCategory": "Housing",
        "subCategories": [
            {
                "name": "Rent",
                "color": "#8E44AD",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f16")
            },
            {
                "name": "Utilities",
                "color": "#3498DB",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f17")
            },
            {
                "name": "Maintenance",
                "color": "#E67E22",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f18")
            }
        ],
        "color": "#8E44AD",
        "spaces": [
            "CASH",
            "BANK",
            "CREDIT_CARD"
        ]
    },
    {
        "_id": new ObjectId("68c8d8d5dfe13cdc534c9f19"),
        "parentCategory": "Transport",
        "subCategories": [
            {
                "name": "Public Transport",
                "color": "#2ECC71",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f1a")
            },
            {
                "name": "Fuel",
                "color": "#E74C3C",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f1b")
            },
            {
                "name": "Taxi / Ride Share",
                "color": "#F1C40F",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f1c")
            }
        ],
        "color": "#2ECC71",
        "spaces": [
            "CASH",
            "BANK",
            "CREDIT_CARD"
        ]
    },
    {
        "_id": new ObjectId("68c8d8d5dfe13cdc534c9f21"),
        "parentCategory": "Entertainment",
        "subCategories": [
            {
                "name": "Movies",
                "color": "#FF8C00",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f22")
            },
            {
                "name": "Concerts",
                "color": "#FF1493",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f23")
            },
            {
                "name": "Games",
                "color": "#00CED1",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f24")
            }
        ],
        "color": "#FF8C00",
        "spaces": [
            "CASH",
            "BANK",
            "CREDIT_CARD"
        ]
    },
    {
        "_id": new ObjectId("68c8d8d5dfe13cdc534c9f25"),
        "parentCategory": "Education",
        "subCategories": [
            {
                "name": "Books",
                "color": "#8B0000",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f26")
            },
            {
                "name": "Courses",
                "color": "#006400",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f27")
            },
            {
                "name": "Workshops",
                "color": "#4B0082",
                "transactionTypes": [
                    "EXPENSE",
                    "PURCHASE"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f28")
            }
        ],
        "color": "#8B0000",
        "spaces": [
            "CASH",
            "BANK",
            "CREDIT_CARD"
        ]
    },
    {
        "_id": new ObjectId("68c8d8d5dfe13cdc534c9f1d"),
        "parentCategory": "Income",
        "subCategories": [
            {
                "name": "Salary",
                "color": "#1ABC9C",
                "transactionTypes": [
                    "INCOME"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f1e")
            },
            {
                "name": "Gifts",
                "color": "#eb34ab",
                "transactionTypes": [
                    "INCOME"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f1e")
            },
            {
                "name": "Interests",
                "color": "#eb3462",
                "transactionTypes": [
                    "INCOME"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f1e")
            },
            {
                "name": "Refunds",
                "color": "#510763",
                "transactionTypes": [
                    "INCOME"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f1e")
            },
            {
                "name": "Rental Income",
                "color": "#076360",
                "transactionTypes": [
                    "INCOME"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f1e")
            },
            {
                "name": "Sale",
                "color": "#576307",
                "transactionTypes": [
                    "INCOME"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f1e")
            },
            {
                "name": "Freelance",
                "color": "#9B59B6",
                "transactionTypes": [
                    "INCOME"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f1f")
            },
            {
                "name": "Investments",
                "color": "#34495E",
                "transactionTypes": [
                    "INCOME"
                ],
                "_id": new ObjectId("68c8d8d5dfe13cdc534c9f20")
            }
        ],
        "color": "#1ABC9C",
        "spaces": [
            "CASH",
            "BANK"
        ]
    }
];

export async function seedCategories() {
  try {
    await Cat.deleteMany({});

    // Insert categories
    const inserted = await Cat.insertMany(categories);
    console.log('Categories inserted successfully:', inserted);

  } catch (err) {
    console.error('Error seeding categories:', err);
  }
}

// export seedCategories();


