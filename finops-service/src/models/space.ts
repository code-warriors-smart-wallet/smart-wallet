import { Schema, Document, model } from 'mongoose';
import User from './user';

export enum SpaceType {
   CASH = 'CASH',
   BANK = 'BANK',
   CREDIT_CARD = 'CREDIT_CARD',
   LOAN_LENT = 'LOAN_LENT',
   LOAN_BORROWED = 'LOAN_BORROWED',
   SAVING_GOAL = 'SAVING_GOAL'
}

export enum COLLABORATOR_STATUS {
   PENDING = 'PENDING',
   ACCEPTED = 'ACCEPTED',
   REJECTED = 'REJECTED',
   LEFT = 'LEFT',
   EXPIRED = 'EXPIRED'
}

interface ICollaborator {
   _id?: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  invitationLink: string;
  expiredAt: Date;
  status: COLLABORATOR_STATUS;
}

export interface ISpace extends Document {
   ownerId: Schema.Types.ObjectId;
   type: SpaceType;
   name: string;
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
   isCollaborative: boolean,
   collaborators: ICollaborator[]
}

const CollaboratorSchema = new Schema<ICollaborator>({
  invitationLink: { type: String, required: true },
  status: { type: String, enum: Object.values(COLLABORATOR_STATUS) },
  expiredAt: { type: Schema.Types.Date },
  userId: {type: Schema.Types.ObjectId, ref: "User", default: null}
});

const SpaceSchema: Schema = new Schema({
   ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
   type: {
      type: String,
      enum: Object.values(SpaceType),
      default: SpaceType.CASH
   },
   name: { type: String },
   color: { type: String },
   loanPrincipal: { type: Schema.Types.Decimal128},
   loanStartDate: { type: Schema.Types.Date},
   loanEndDate: { type: Schema.Types.Date},
   creditCardLimit: { type: Schema.Types.Decimal128},
   creditCardStatementDate: { type: Schema.Types.Date},
   creditCardDueDate: { type: Schema.Types.Date},
   isCollaborative: { type: Boolean },
   isDefault: { type: Boolean, default: false },
   targetAmount: { type: Schema.Types.Decimal128},
   desiredDate: { type: Schema.Types.Date},
   collaborators: { type: [CollaboratorSchema], default: []}
}, {
   timestamps: true
});

export default model<ISpace>('Space', SpaceSchema);
