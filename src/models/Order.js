const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },
    paymentMethod: { type: String, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true },
    vipAtPurchase: { type: Boolean, required: true },
    status: { type: String, default: 'confirmado' },
  },
  { timestamps: true }
);

orderSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    status: this.status,
    paymentMethod: this.paymentMethod,
    items: this.items.map((item) => ({
      productId: item.product.toString(),
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    subtotal: this.subtotal,
    discount: this.discount,
    shipping: this.shipping,
    total: this.total,
    vipAtPurchase: this.vipAtPurchase,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Order', orderSchema);
