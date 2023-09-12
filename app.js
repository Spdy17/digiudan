require('dotenv').config();
const express = require("express");
const path = require("path");
const app = express();
const bodyParser = require("body-parser");
const hbs = require("hbs");
const port = process.env.PORT || 4000;
require("./db/conn")
const Register = require("./models/registers");
const bcrypt = require("bcryptjs")
const axios = require('axios');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser")
const auth = require("./middleware/auth");
const { Console } = require('console');






const static_path = path.join(__dirname, "../assets");
const template_path = path.join(__dirname, "../templates/views");
const partial_path = path.join(__dirname, "../templates/partials");

app.use(express.static(static_path));
app.use(cookieParser())
app.set("view engine", "hbs")
app.set("views", template_path)
hbs.registerPartials(partial_path)
// app.use(express.json());
app.use(express.urlencoded({ extended: false }))


// get
app.get("/", (req, res) => {
    res.render("index")

});
app.get("/contact", (req, res) => {
    res.render("contact")
});
app.get("/about", (req, res) => {
    res.render("about")
});
app.get("/privacy", (req, res) => {
    res.render("privacy")
});
app.get("/refund", (req, res) => {
    res.render("refund")
});
app.get("/courses", (req, res) => {
    res.render("courses")
});
app.get("/module", (req, res) => {
    res.render("module")
});
app.get("/starter", (req, res) => {
    let course = req.path.slice(1,req.path.length);
    res.render("register",{course}); 
});
app.get("/advance", (req, res) => {
    let course = req.path.slice(1,req.path.length);
    res.render("register",{course}); 
});
app.get("/premium", (req, res) => {
    let course = req.path.slice(1,req.path.length);
    res.render("register",{course}); 
});
app.get("/starter-module", (req, res) => {
    let coursemodule = req.path.slice(1,req.path.length);
    res.render("module",{coursemodule}); 
});
// app.get("/advance-module", (req, res) => {
//     let coursemodule = req.path.slice(1,req.path.length);
//     res.render("module",{coursemodule}); 
// });
// app.get("/premium-module", (req, res) => {
//     let coursemodule = req.path.slice(1,req.path.length);
//     res.render("module",{coursemodule}); 
// });

app.get("/secret", (req, res) => {
    res.send("secret")

});
app.get("/forgot-password", (req, res) => {
    res.render("forgot-password")

});
app.get("/login",(req, res) => {
    res.render("login")
});
app.get("/adminlogin", (req, res) => {
    res.render("adminlogin")
});
app.get("/update", (req, res) => {

    res.render("update")
});
app.get("/logout", (req, res) => {
    
    try {
        res.clearCookie("jwt");
        console.log("logged out");
        res.redirect("/")
    } catch (error) {
        res.status(500).send(error)
    }

});



// post for register
app.post("/register", async (req, res) => {
    try {

        const password = req.body.password;
        const cpassword = req.body.cpassword;
        const module = req.body.cmodule;
        const nameinput = req.body.name;
        const nameslice = nameinput.slice(0, 3);
        const refid = nameslice + (new Date()).getTime();
        const ref = req.body.ref;
        if (password === cpassword) {
            const registerEmployee = new Register({
                refid: refid,
                coursemodule: req.body.cmodule,
                name: req.body.name,
                phone: req.body.phone,
                username: req.body.username,
                password: req.body.password,
                cpassword: req.body.cpassword,
                referral: req.body.ref

            });
            console.log(module);

            // const token = await registerEmployee.generateAuthToken();
            // console.log("The token1 part is "+ token);
            // console.log("The token1 part is "+ token);
            // res.cookie("jwt",token,{
            //     expires: new Date(Date.now()+30000),
            //     httpOnly:true
            // });
            // console.log(cookie)
            const registered = await registerEmployee.save();
            res.status(201).render("login")


        } else {
            res.render("error")
        }

    } catch (error) {
        res.status(400).render("alreadyexist");
    }
});

// post for login
app.post("/login", async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const useremail = await Register.findOne({ username: username });
        const myreferral = await (useremail.refid);
        const cmodule = await (useremail.coursemodule);
        const name = await (useremail.name);
        const image = await (useremail.image);
        const total_ref = await Register.find({ $and: [{ referral: myreferral }] }).count();
        const isMatch = await bcrypt.compare(password, useremail.password);
        await Register.findOneAndUpdate({ username: useremail.username }, { total_referral: total_ref });
       
        // storing cookie
        const token = await useremail.generateAuthToken();
        res.cookie("jwt",token,{
            expiresIn: '1h' ,
            // expires: new Date(Date.now()+60000),
            httpOnly:true,
            // secure:true
        });
       
        if (isMatch) {
           
            res.status(201).render("client", { cmodule: cmodule, name: name, total_ref: total_ref, image: image,myreferral:myreferral })

        } else {
            res.status(400).render("error")

        }
    } catch (error) {
        res.status(400).render("error");

    }
})

// admin login

app.post("/adminlogin", async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const useremail = await Register.findOne({ username: username });
        const isMatch = await bcrypt.compare(password, useremail.password);
        const referral = await (useremail.refid);
        const cmodule = await (useremail.coursemodule);
        const countpro = await Register.find({ $and: [{ coursemodule: "pro" }] }).count();
        const countinter = await Register.find({ $and: [{ coursemodule: "inter" }] }).count();
        const countbeginner = await Register.find({ $and: [{ coursemodule: "beginner" }] }).count();
        const totalsold = await Register.find().count() - 1;
        // console.log(isMatch)
        if (isMatch) {
            if (cmodule == "") {

                Register.find({})
                    .then((x) => {
                        res.status(201).render("adminoutput", { x, totalsold, countpro, countinter, countbeginner })
                        // console.log(x)
                    })
                    .catch((y) => {
                        console.log(y)
                    })
            }

        } else {
            res.status(400).render("error")

        }
    } catch (error) {
        res.status(400).render("error");

    }
})



// post for update
app.post("/update", async (req, res) => {
    try {
        const username = req.body.username;
        const new_name = req.body.name;
        const image = req.body.image;
        const total_referral = req.body.total_referral;
        const useremail = await Register.findOne({ username: username });
        const username_new = await (useremail.username);
        const total_referral_string = parseInt(total_referral)
        await Register.findOneAndUpdate({ username: username }, { image: image })

        if (username == username_new) {
            res.status(201).render("login")

        } else {
            res.status(400).render("error")

        }


    } catch (error) {
        res.status(400).render("error");
    }
});

app.post("/forgot-password", async (req, res) => {
    try {
        const username = req.body.username;
        console.log(req.body.username)

        if (username) {
            res.status(201).render("enterotp")

        } else {
            res.status(400).render("error")

        }


    } catch (error) {
        res.status(400).render("error");
    }
});





app.listen(port, () => {
    console.log(`server is running at port ${port}`)
})