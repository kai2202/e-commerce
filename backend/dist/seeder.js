"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const User_1 = __importDefault(require("./models/User"));
const Product_1 = __importDefault(require("./models/Product"));
const Order_1 = __importDefault(require("./models/Order"));
const Category_1 = __importDefault(require("./models/Category"));
const Coupon_1 = __importDefault(require("./models/Coupon"));
const Banner_1 = __importDefault(require("./models/Banner"));
// Temporarily import the mock data from the frontend
// We can use require to bypass some TS config limitations if needed, or import directly if paths are set up.
// Since we are running this with ts-node, we can import it directly.
const data_1 = require("./data");
dotenv_1.default.config();
(0, db_1.default)();
const importData = async () => {
    try {
        await User_1.default.deleteMany();
        await Product_1.default.deleteMany();
        await Order_1.default.deleteMany();
        await Category_1.default.deleteMany();
        await Coupon_1.default.deleteMany();
        await Banner_1.default.deleteMany();
        const createdUsers = await User_1.default.insertMany(data_1.INITIAL_USERS);
        console.log('Users Imported!');
        await Product_1.default.insertMany(data_1.INITIAL_PRODUCTS);
        console.log('Products Imported!');
        // Since mock orders use random IDs for customers, we might want to just insert them as is for now.
        await Order_1.default.insertMany(data_1.INITIAL_ORDERS);
        console.log('Orders Imported!');
        await Category_1.default.insertMany(data_1.INITIAL_CATEGORIES);
        console.log('Categories Imported!');
        await Coupon_1.default.insertMany(data_1.INITIAL_COUPONS);
        console.log('Coupons Imported!');
        await Banner_1.default.insertMany(data_1.INITIAL_BANNERS);
        console.log('Banners Imported!');
        console.log('Data Imported successfully!');
        process.exit();
    }
    catch (error) {
        console.error(`Error with data import: ${error}`);
        process.exit(1);
    }
};
const destroyData = async () => {
    try {
        await User_1.default.deleteMany();
        await Product_1.default.deleteMany();
        await Order_1.default.deleteMany();
        await Category_1.default.deleteMany();
        await Coupon_1.default.deleteMany();
        await Banner_1.default.deleteMany();
        console.log('Data Destroyed!');
        process.exit();
    }
    catch (error) {
        console.error(`Error with data destruction: ${error}`);
        process.exit(1);
    }
};
if (process.argv[2] === '-d') {
    destroyData();
}
else {
    importData();
}
