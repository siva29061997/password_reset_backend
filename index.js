const express = require("express");
const jwt = require("jsonwebtoken")
const dotEnv = require("dotenv").config();
const cors = require("cors");
const bcrypt = require("bcryptjs")
const mongodb = require("mongodb")
const mongoClient = mongodb.MongoClient;
const nodemailer = require("nodemailer")
const URL = process.env.DB;
const DB = "password_reset";
const app = express();
app.use(express.json());

app.use(cors({}))

app.post("/verify-email", async function (req, res) {
    try {
        const connection = await mongoClient.connect(URL);

        const db = connection.db(DB);

        let mail = await db.collection("reset").findOne({ email: req.body.email });



        if (mail) {

            let token = jwt.sign({ _id: mail._id }, process.env.JCODE)
            await db.collection("reset").findOneAndUpdate({ _id: mail._id }, { $set: { token_id: token } })
            let sender = nodemailer.createTransport({

                service: 'gmail',

                auth: {
                    user: "nsiva29061997@gmail.com",
                    pass: `${process.env.MLC}`
                },
                debug: false,
                logger: true

            });

            let composeEmail = {
                from: "nsiva29061997@gmail.com",
                to: `${mail.email}`,
                subject: "Reseting the password",
                text: `https://6382e1702180170c8411a9c2--peppy-begonia-60eb3d.netlify.app/reset?code=${token}`
            }
            sender.sendMail(composeEmail, (err) => {
                if (err) {
                    console.log("Error found", err)
                } else {
                    console.log("Mail sent")
                }
            })

            res.json({ messege: "Email have been sent to your mail id" })
        } else {
            res.json({ messege: "User not found" })
        }
        await connection.close();
    } catch (error) {
        console.log(error)
        res.status(500).json({ messege: "something went wrong" })

    }


});

app.post("/user", async function (req, res) {
    try {
        const connection = await mongoClient.connect(URL);

        const db = connection.db(DB);

        let test = await db.collection("reset").insertOne(req.body);
        if (test) {
            res.json({ messege: "user verified" })
        } else {
            res.json({ messege: "User not found" })
        }
        await connection.close();
    } catch (error) {
        console.log(error)
        res.status(500).json({ messege: "something went wrong" })
    }
});

app.get("/token-verify", async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL)
        let db = connection.db(DB)

        let data = await db.collection("reset").findOne({ token_id: req.headers.authorization })

        await connection.close()

        if (data) {

            res.status(200).json({ messege: "Accepted" })
        }
        else {
            res.status(404).json({ messege: "Not authorised" })
        }

    } catch (error) {
        res.status(404).json({ messege: "404 Not found" })
    }

});

app.put("/update", async function (req, res) {
    try {
        const connection = await mongoClient.connect(URL);
        let db = connection.db(DB);
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(req.body.password, salt);

        let updated = await db.collection("reset").findOneAndUpdate({ token_id: req.headers.authorization }, { $set: { password: hash } });
        if (updated) {
            await db.collection('reset').findOneAndUpdate({ token_id: req.headers.authorization }, { $unset: { token_id: "" } })
        }
        await connection.close()
        res.json({ messege: "done" })
    } catch (error) {
        console.log(error)
        res.json({ messege: "something went down" })
    }

})

app.get("/", (req, res) => {
    res.send(`server connected`)
})

const port = process.env.PORT

app.listen(port, () => {
    console.log(`server running on port : ${port}`)
})
