import mongoose, { Document, Schema, Model } from "mongoose";

interface IWallet extends Document {
  userId: string;         
  publicKey: string;
  privateKey: string;
  balance: string;
  fee: number;
  createdAt?: Date;
}

const walletSchema: Schema<IWallet> = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true, 
  },
  publicKey: {
    type: String,
    required: true,
    unique: true,
  },
  privateKey: {
    type: String,
    required: true,
  },
  balance: {
    type: String,
    required: true,
  },
  fee: {
    type: Number,
    required: true,
    default: 0.0, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const Wallet: Model<IWallet> = mongoose.model<IWallet>("Wallet", walletSchema);

export default Wallet;
