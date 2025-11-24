//Definition & imports
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();

// Middlewares
require("dotenv").config();
app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  console.log(
    `⚡ ${req.method} - ${req.path} from ${
      req.host
    } at ⌛ ${new Date().toLocaleString()}`
  );
  next();
});

//ports & clients
const port = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@crud-operation.iftbw43.mongodb.net/?appName=CRUD-operation`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//listeners
client
  .connect()
  .then(() => {
    app.listen(port, () => {
      console.log(`Hero Apps Server listening ${port}`);
      console.log(`Hero Apps Server Connected with DB`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

//DB & collections
const database = client.db("heroAppsDB");
const appsCollection = database.collection("apps");

//Apps Route

app.get("/allapps", async (req, res) => {
  // const limit = req.query.limit;
  // const skip = req.query.skip;
  const {
    limit = 0,
    skip = 0,
    sort = "size",
    order = "desc",
    search,
  } = req.query;
  console.log(limit);
  const fields = {
    title: 1,
    image: 1,
    rating: 1,
    downloads: 1,
    size: 1,
  };
  const query = search
    ? {
        title: { $regex: search, $options: "i" },
      }
    : {};
  const sortBy = {};
  sortBy[sort || "size"] = order === "asc" ? 1 : -1;
  const count = await appsCollection.countDocuments();
  console.log(count);
  try {
    const apps = await appsCollection
      .find(query)
      .sort(sortBy)
      .project(fields)
      .limit(Number(limit))
      .skip(Number(skip))
      .toArray();
    res.send({ apps, total: count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/apps", async (req, res) => {
  try {
    const apps = await appsCollection.find().toArray();
    res.send(apps);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/apps/:id", async (req, res) => {
  try {
    const appId = req.params.id;

    if (appId.length != 24) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const query = new ObjectId(appId);
    const app = await appsCollection.findOne({ _id: query });
    res.json(app);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Basic routes
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Hero Apps Server" });
});
//404
app.all(/.*/, (req, res) => {
  res.status(404).json({
    status: 404,
    error: "API not found",
  });
});
