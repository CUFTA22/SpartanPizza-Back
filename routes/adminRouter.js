const router = require("express").Router();
const Ingredient = require("../models/ingredientModel");
const Order = require("../models/orderModel");

router.get("/adminRequest", async (req, res) => {
  try {
    // Top 5 ingredients
    const top5 = await Ingredient.find({}, ["name", "amount"], {
      skip: 0,
      limit: 5,
      sort: {
        amount: -1,
      },
    });

    // Total money earned
    const money = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$price",
          },
        },
      },
    ]);

    // Total working time
    const totalTime = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$time",
          },
        },
      },
    ]);

    // All orders
    const allOrders = await Order.find({}, [
      "completed",
      "name",
      "size",
      "_id",
      "time",
      "price",
    ]);

    res.status(200).json({
      totalTime: totalTime[0].total,
      top5,
      money: money[0].total,
      allOrders,
    });
  } catch (error) {
    res.status(400).json({ variant: "error", message: "Server Error!" });
  }
});

module.exports = router;
