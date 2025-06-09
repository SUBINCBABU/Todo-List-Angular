import mongoose from "mongoose"



const schema = mongoose.Schema
const userschema = new schema({
   name: { type: String, required: true,  },
   email: { type: String, required: true,  },
   password: { type: String, required: true},
   phone: { type: Number},
  
})


const userModel = mongoose.model("Todo-Users", userschema)

export default userModel