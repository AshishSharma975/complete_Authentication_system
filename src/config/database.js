import mongoose from "mongoose";


async function connectTODB(){
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Database connected")
    } catch (error) {
        console.log("Database connection failed",error)
    }
}

export default connectTODB