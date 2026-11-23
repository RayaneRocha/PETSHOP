const mongoose = require('mongoose');
const { business } = require('../config');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Soma dos valores pagos em compras finalizadas (R$)
    totalSpent: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Regra 3: o cliente é VIP depois de gastar R$ 100,00 ou mais em compras.
userSchema.virtual('isVip').get(function isVip() {
  return this.totalSpent >= business.vipThreshold;
});

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    totalSpent: this.totalSpent,
    isVip: this.isVip,
  };
};

module.exports = mongoose.model('User', userSchema);
