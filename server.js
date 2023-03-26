const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { createClient } = require("redis");

const DEFAULT_EXPIRATION = 3600;

const app = express();
const client = createClient();
app.use(cors());

app.get("/photos", async (req, res) => {
  const albumId = req.query.albumId;
  const cachedData = await client.get(`photos?albumId=${albumId}`);

  if (cachedData) {
    return res.json(JSON.parse(cachedData));
  } else {
    const { data } = await axios.get(
      "https://jsonplaceholder.typicode.com/photos",
      { params: { albumId } }
    );
    client.setEx(
      `photos?albumId=${albumId}`,
      DEFAULT_EXPIRATION,
      JSON.stringify(data)
    );
    return res.json(data);
  }
});

app.get("/photos/:id", async (req, res) => {
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
  );
  res.json(data);
});

const init = async () => {
  try {
    await client.connect();
    console.log("Connected to Redis server");

    app.listen(5000, () => {
      console.log("Server is running on port 5000");
    });
  } catch (error) {
    console.error("Error connecting to Redis server:", error);
  }
};

init();
