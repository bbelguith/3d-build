import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// 1. DATABASE CONNECTION
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT,
    logging: false,
  }
);

const db = {};

// 2. IMPORT MODELS (Mapping lowercase files to Variables)
// These paths match your Screenshot exactly (lowercase names)
import HouseModel from "./house.js";
import HouseImageModel from "./houseImage.js";
import RoomImageModel from "./roomImage.js";
import GalleryImageModel from "./galleryImage.js";
import FloorPlanImageModel from "./floorPlanImage.js";
import VideoModel from "./video.js";
import UserModel from "./user.js";
import CommentModel from "./Comment.js";

// 3. INITIALIZE MODELS (Mapping Variables to Uppercase DB Keys)
// server.js asks for db.House, db.Video, etc. We set them here.

db.House = HouseModel(sequelize, Sequelize.DataTypes);
db.Video = VideoModel(sequelize, Sequelize.DataTypes);
db.User = UserModel(sequelize, Sequelize.DataTypes);
db.Comment = CommentModel(sequelize, Sequelize.DataTypes);

db.HouseImage = HouseImageModel(sequelize, Sequelize.DataTypes);
db.RoomImage = RoomImageModel(sequelize, Sequelize.DataTypes);
db.GalleryImage = GalleryImageModel(sequelize, Sequelize.DataTypes);
db.FloorPlanImage = FloorPlanImageModel(sequelize, Sequelize.DataTypes);

// 4. ASSOCIATIONS
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
export { sequelize };