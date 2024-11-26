import { Schema,model,SchemaType, SchemaTypes, Types } from "mongoose";


interface UserDetail{
    userId : Types.ObjectId,
    name : string,
    dateOfBirth : Date
}


const UserDetailsSchema = new Schema<UserDetail>({
    userId : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        require : true
    },
    name : {
        type : String,
        require : true
    },
    dateOfBirth : {
        type : Date,
        require : true
    }
})

const UserDetail = model<UserDetail>('UserDetail',UserDetailsSchema);

module.exports = UserDetail;