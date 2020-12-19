const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
});

module.exports = Ingredient = mongoose.model("ingredients", ingredientSchema);
