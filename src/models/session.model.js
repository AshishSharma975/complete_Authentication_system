import mongoose from "mongoose";


const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "yt-user"
    },
    refreshToken: {
        type: String,
        required: [true, "refresh token is required"]
    },
    ip: {
        type: String,
        required: [true, "ip is required"]
    },
    userAgent: {
        type: String,
        required: [true, "user agent is required"]
    },
    revoked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

const sessionModel = mongoose.model("yt-session", sessionSchema)

export default sessionModel