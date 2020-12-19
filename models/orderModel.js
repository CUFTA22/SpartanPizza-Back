const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  size: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: Number, required: true },
  time: { type: Number, required: true },
  price: { type: Number, required: true },
  completed: { type: Boolean, default: false },
});

module.exports = Order = mongoose.model("orders", orderSchema);
