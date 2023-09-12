
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const userSchema = new mongoose.Schema({
    refid: {
        type: "string",
        required: true
    },
    coursemodule: {
        type: "string",
        required: true
    },
    name: {
        type: "string",
        required: true
    },
    phone: {
        type: "number",
        required: true,
        unique: true
    },
    username: {
        type: "string",
        required: true,
        unique: true
    },
    password: {
        type: "string",
        required: true
    },
    cpassword: {
        type: "string",
        // required: true
    },
    referral: {
        type: "string",

    },
    total_referral: {
        type: "number",
        optional: ''

    },
    // image:{
    //     type:String,
    //     optional: ''
    //   },
    image:
    {
        data: Buffer,
        contentType: String
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]


})
userSchema.methods.generateAuthToken = async function () {
    try {
        // await jwt.sign({unique_key or _id}, secret_key);
        console.log("this is 1 - "+ this._id);
        console.log( process.env.SECRET_KEY);
        const token = await jwt.sign({_id: this._id.toString() },process.env.SECRET_KEY);
        console.log("this is 3 - "+ token);
        this.tokens = this.tokens.concat({ token: token });
        return token;
    } catch (error) {
        res.send("Error in jwt")
    }
}

// encription

userSchema.pre("save", async function (next) {

    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
        // this.cpassword = await bcrypt.hash(this.cpassword, 10);

        this.cpassword = undefined
    };

    next()
})

// creating collection

const Register = new mongoose.model("Register", userSchema);

module.exports = Register;

