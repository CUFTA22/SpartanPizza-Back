require("dotenv").config();
const Order = require("./models/orderModel");
const Ingredient = require("./models/ingredientModel");

const express = require("express");
const mongoose = require("mongoose");
const socketIO = require("socket.io");
const http = require("http");
const cors = require("cors");

const PORT = process.env.PORT || 9000;

// Set up express

const app = express();

// Middlewares

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

// DB connection

mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  },
  () => console.log("MongoDB connected")
);

// API routes

app.get("/", (req, res) => res.send("Hello World"));

app.use("/auth", require("./routes/authRouter"));
app.use("/admin", require("./routes/adminRouter"));

// Create socket

const updateIngredients = (ingredients) => {
  ingredients.forEach((ing) => {
    // Find vraca array a findById vraca sam objekat zato je contract[0]
    Ingredient.find({ name: ing.name }, (err, contract) => {
      contract[0].amount += 1;
      contract[0].save();
    });
  });
};

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected: " + socket.id);

  // Return current orders from db
  socket.on("initial_data", () => {
    Order.find({ completed: false }, (err, res) => {
      io.sockets.emit("get_data", res);
    });
  });

  // Remove order
  socket.on("delete_item", (arg1) => {
    Order.findByIdAndDelete(arg1, (err, doc) => {
      io.sockets.emit("feedback", {
        variant: "success",
        message: "Order Canceled!",
      });
      io.sockets.emit("update_data");
    });
  });

  // Adding pizza to queue
  // Acknowledgement - "Events are great, but in some cases you may want a more classic request-response API."
  socket.on("send_pizza", async (arg1, arg2, arg3, arg4) => {
    //console.log(arg1); // Object - Size, price , time, name
    //console.log(arg2); // Number - Price
    //console.log(arg3); // Number - Time
    //console.log(arg4); // Array - Ingredients

    if (!arg1.size || !arg1.name || !arg1.address || !arg1.phone) {
      return io.sockets.emit("feedback", {
        variant: "error",
        message: "No Empty Fields!",
      });
    } else {
      io.sockets.emit("feedback", {
        variant: "info",
        message: "New Order Placed!",
      });
    }

    // Update ingredients for top 5 ingredients
    updateIngredients(arg4);

    const newOrder = new Order({
      size: arg1.size,
      name: arg1.name,
      address: arg1.address,
      phone: arg1.phone,
      time: arg3,
      price: arg2,
    });
    const savedOrder = await newOrder.save();

    const makePizza = (order) => {
      Order.find({ completed: false }, (err, res) => {
        if (res.length > 15) {
          return io.sockets.emit("feedback", {
            variant: "error",
            message: `Queue Full!`,
          });
        }
        if (res.length !== 0) {
          io.sockets.emit("update_data");
          setTimeout(() => {
            Order.findById(res[0]._id, (err, res) => {
              if (res?.completed === false) {
                Order.findByIdAndUpdate(
                  res._id,
                  { completed: true },
                  (err, docs) => {
                    if (!err) {
                      io.sockets.emit("update_data");
                      io.sockets.emit("feedback", {
                        variant: "success",
                        message: `Order For ${res.name} Completed!`,
                      });
                    }
                  }
                );
              }
            });

            makePizza();
          }, res[0].time);
        }
      });
    };
    Order.find({ completed: false }, (err, res) => {
      if ((res.length = 1)) {
        makePizza();
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected: " + socket.id);
  });
});

// Route not found

app.use((req, res) => {
  res.status(404).json({ message: "Route not found!" });
});

// Start up server

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
