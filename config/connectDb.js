import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()

if(!process.env.MONGODB_URI){
    throw new Error(
        "Please Provide mongodb_uri  in .env file"
    )
}

async function connectDb(){
    try{
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("Connect DB")
    }catch(error){
        console.log("mongodb connection error",error)
    }
}

export default connectDb