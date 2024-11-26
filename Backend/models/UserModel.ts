
import {Schema,model} from "mongoose";

export interface UserRegister {
    username : string,
    password : string,
}

const UserSchema = new Schema<UserRegister>({
    username : {
        type : String,
        require : true
    },
    password : {
        type : String,
        require : true
    }
})

const User = model<UserRegister>('User',UserSchema);

module.exports = User;