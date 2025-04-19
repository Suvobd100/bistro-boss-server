const express = require("express");
const app = express();
const cors = require("cors");

require("dotenv").config();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8qsyw.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    // Initialize collections
    const menuCollection = client.db("bistroDb").collection("menu"); // ✅ Fixed
    const reviewsCollection = client.db("bistroDb").collection("reviews"); // ✅ Fixed
    const cartCollection = client.db("bistroDb").collection("carts");

    // API Endpoints
    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });
    // carts collection

    // view data carts
    app.get("/carts", async (req, res) => {
      try {
        const email = req.query.email;
        const query = { email: email };
        const result = await cartCollection.find(query).toArray();
        // Check if result exists and is an array
        if (!Array.isArray(result)) {
          console.error("Unexpected result format:", result);
          return res.status(500).json({
            success: false,
            message: "Server error: Unexpected data format",
          });
        }
        // Successful response
        // console.log(`Found ${result.length} cart items`); // For debugging
        res.status(200).json({
          success: true,
          data: result,
        });
      } catch (error) {
        console.log("Error Fetching Cart item", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch cart items",
          error: error.message,
        });
      }
    });

    // save data
    app.post("/carts", async (req, res) => {
      try {
        const cartItem = req.body;
        console.log("Received cart item:", cartItem); // For debugging

        // Basic validation
        if (!cartItem?.menuId || !cartItem?.email) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // // Check if item already exists in cart
        // const existingItem = await cartCollection.findOne({
        //   menuId: cartItem.menuId,
        //   email: cartItem.email
        // });

        // if (existingItem) {
        //   return res.status(400).json({ error: "Item already in cart" });
        // }

        const result = await cartCollection.insertOne(cartItem);
        res.status(201).json(result);
      } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // delete
    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      // console.log(query);
      const result = await cartCollection.deleteOne(query);
      // console.log(result);
      res.send(result);
    });

    // Test MongoDB connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged MongoDB. Connection is stable.");
  } catch (err) {
    console.error("MongoDB Error:", err);
  }
}

run().catch(console.dir);

// Basic route
app.get("/", (req, res) => {
  res.send("Bistro Boss Server is Running 🚀");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
