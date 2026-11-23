const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    emoji: { type: String, default: '🐾' },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

productSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    description: this.description,
    category: this.category,
    emoji: this.emoji,
    price: this.price,
    stock: this.stock,
    inStock: this.stock > 0,
  };
};

module.exports = mongoose.model('Product', productSchema);
