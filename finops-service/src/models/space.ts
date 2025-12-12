import { Schema, Document, model } from 'mongoose';

export enum SpaceType {
   CASH = 'CASH',
   BANK = 'BANK',
   CREDIT_CARD = 'CREDIT_CARD',
   LOAN_LENT = 'LOAN_LENT',
   LOAN_BORROWED = 'LOAN_BORROWED',
   SAVING_GOAL = 'SAVING_GOAL'
}

export interface ISpace extends Document {
   ownerId: Schema.Types.ObjectId;
   type: SpaceType;
   name: string;
   // description?: string;
   isDefault: boolean;
   loanPrincipal: Schema.Types.Decimal128,
   loanStartDate: Schema.Types.Date,
   loanEndDate: Schema.Types.Date,
   creditCardLimit: Schema.Types.Decimal128
   creditCardStatementDate: Schema.Types.Date,
   creditCardDueDate: Schema.Types.Date,
   color: string,
   targetAmount: Schema.Types.Decimal128,
   desiredDate: Schema.Types.Date,
   // collaborators: IUser[]
}

const SpaceSchema: Schema = new Schema({
   ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
   type: {
      type: String,
      enum: Object.values(SpaceType),
      default: SpaceType.CASH
   },
   name: { type: String },
   color: { type: String },
   loanPrincipal: { type: Schema.Types.Decimal128 },
   loanStartDate: { type: Schema.Types.Date },
   loanEndDate: { type: Schema.Types.Date },
   creditCardLimit: { type: Schema.Types.Decimal128 },
   creditCardStatementDate: { type: Schema.Types.Date },
   creditCardDueDate: { type: Schema.Types.Date },
   // description: { type: String },
   // isIndividual: { type: Boolean },
   isDefault: { type: Boolean, default: false },
   targetAmount: { type: Schema.Types.Decimal128 },
   desiredDate: { type: Schema.Types.Date },
   // collaborators: {type: []}
}, {
   timestamps: true
});

export default model<ISpace>('Space', SpaceSchema);
