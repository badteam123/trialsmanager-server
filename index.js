const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = 3000;

const uri =
  "mongodb+srv://mapmanger:" +
  process.env.password +
  "@trialsmanager.zmbzc6p.mongodb.net/?retryWrites=true&w=majority&appName=trialsmanager";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectToMongo() {
  try {
    // Connect the client to the server
    await client.connect();

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToMongo();

// Middleware to parse JSON bodies
app.use(express.json());

app.post("/maps", async (req, res) => {
  try {
    const document = req.body;

    const { mid } = document; // Correctly extract `mid` from the document
    const collection = client.db("trials").collection("maps");

    // Find the document with the given map ID
    const duplicate = await collection.findOne({ mid });

    if (duplicate) {
      // If a duplicate is found, respond with a 409 status and a message
      console.log("Duplicate map found: " + mid);
      return res.status(409).send("You can't upload the same map twice, goober.\nStorage isn't cheap!");
    }

    // Generate a password and add it to the document
    document.pass = generatePass();
    const result = await collection.insertOne(document);

    // Attach the generated password to the result for response
    result.pass = document.pass;
    console.log("New map added: " + result.insertedId);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send("Error inserting document: " + error.message);
  }
});

app.get("/maps", async (req, res) => {
  try {
    const collection = client.db("trials").collection("maps");
    const documents = await collection.find({}).toArray();
    res.status(200).send(documents);
  } catch (error) {
    res.status(500).send("Error retrieving documents: " + error.message);
  }
});

app.post("/delete", async (req, res) => {
  try {
    const { pass } = req.body;
    const collection = client.db("trials").collection("maps");

    // Find the document with the given password
    const document = await collection.findOne({ pass });

    if (document && pass != undefined) {
      // If the document is found, delete it
      const result = await collection.deleteOne({ pass });

      console.log("Deleted map with pass: " + pass);
      res.status(200).send("Deleted map");
    } else {
      // If the document is not found, return a 404 status
      console.log("Error deleting map with pass: " + pass);
      res.status(404).send("You don't own that map, silly");
    }
  } catch (error) {
    res.status(500).send("Error deleting document: " + error.message);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

function generatePass() {
  var length = 20,
    charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    retVal = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}
