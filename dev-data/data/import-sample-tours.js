// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require("mongoose");
const fs = require("fs");
const dotenv = require("dotenv");
const Tour = require("../../models/tourModel");

const User = require("../../models/userModel");
const Review = require("../../models/reviewModel");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD,
);

const connectToDB = async () => {
  try {
    await mongoose.connect(DB, {
      autoIndex: true,
    });
    console.log("Connected to Mongodb Atlas");
  } catch (error) {
    console.error(error);
  }
};
connectToDB();

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));

const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8"),
);

const importDate = async () => {
  await Tour.create(tours);
  await User.create(users, { validateBeforeSave: false });
  await Review.create(reviews);

  console.log("data has imported");
};
const deleteData = async () => {
  await Tour.deleteMany();
  await User.deleteMany();
  await Review.deleteMany();

  console.log("data has deleted");
};

if (process.argv[2] === "--import") importDate();
if (process.argv[2] === "--delete") deleteData();
