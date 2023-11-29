const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// middle
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ktxzlkz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const UserDatabase = client.db("BloodDonation").collection("userInfo");
        const division = client.db("BloodDonation").collection("division");
        const district = client.db("BloodDonation").collection("distict");
        const DonationRequest = client.db("BloodDonation").collection("DonationRequest");
        const BlogDB = client.db("BloodDonation").collection("blogs");

        const verifyToken = (req, res, next) => {
            // console.log('this is the port of', req.headers);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers?.authorization?.split(' ')[1]
            // console.log("token", token);
            jwt.verify(token, process.env.TOKEN_SECRET_KEY, (error, decode) => {
                if (error) {
                    return res.status(401).send({ message: 'unauthorized access' });

                }
                req.decode = decode
                next();
            })

        }
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { Email: email };
            const user = await UserDatabase.findOne(query);
            const isAdmin = user?.Role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        }

        // jwt

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.TOKEN_SECRET_KEY, { expiresIn: '1h' })

            res.send({ token });
        })


        app.post('/blogs', async (req, res) => {
            const blog = req.body;
            const result = await BlogDB.insertOne(blog);
            res.send(result);
        })
        app.get('/blogs', async (req, res) => {
            const result = await BlogDB.find().toArray();
            res.send(result);
        })

        // search page api hear
        app.get('/search', async (req, res) => {
            const email = req.query?.email
            const blood = req.query?.blood
            const district = req.query?.district
            const division = req.query?.division
            console.log(blood);
            let query = {};

            if (email) {
                query.email = email
            }
            if (division) {
                query.division = division
            }

            if (district) {
                query.district = district
            }
            // if (blood) {
            //     query.blood = blood
            // }


            const result = await DonationRequest.find(query).toArray();
            console.log(result);
            res.send(result);

        })

        // DonationRequest api
        app.delete('/delete/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await DonationRequest.deleteOne(query);
            res.send(result);

        })
        app.post('/request', async (req, res) => {
            const data = req.body;
            const result = await DonationRequest.insertOne(data);
            res.send(result);
        })
        app.get('/request', async (req, res) => {
            const result = await DonationRequest.find().toArray();
            res.send(result);
        })
        app.get('/request/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await DonationRequest.find(query).toArray();
            res.send(result);
        })
        app.get('/request/man/:id', async (req, res) => {
            const id = req.params.id

            const query = { _id: new ObjectId(id) }
            const result = await DonationRequest.findOne(query);
            res.send(result);
        })
        app.patch('/request/cancel/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }

            const updateDoc = {
                $set: {
                    status: 'canceled '
                }

            };
            const result = await DonationRequest.updateOne(query, updateDoc);
            res.send(result);
        })
        app.patch('/request/done/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }

            const updateDoc = {
                $set: {
                    status: 'done'
                }

            };
            const result = await DonationRequest.updateOne(query, updateDoc);
            res.send(result);
        })
        app.patch('/request/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }

            const updateDoc = {
                $set: {
                    status: 'inprogress'
                }

            };
            const result = await DonationRequest.updateOne(query, updateDoc);
            res.send(result);
        })
        app.get('/pending/all', async (req, res) => {
            const status = req.query.status;
            const user = req.query?.user;
            let query = {};

            if (user) {
                query.email = user
            }
            if (status) {
                query.status = status
            }

            const result = await DonationRequest.find(query).toArray();
            res.send(result);
        })
        app.get('/pending', async (req, res) => {
            const query = { "status": { $in: ["pending"] } }
            const result = await DonationRequest.find(query).toArray();
            res.send(result);
        })

        // division and district related api
        app.get('/division', async (req, res) => {
            const result = await division.find().toArray();
            res.send(result);
        })
        app.get('/district', async (req, res) => {
            const result = await district.find().toArray();
            res.send(result);
        })


        // user related api
        app.post('/users', verifyToken, async (req, res) => {
            const user = req.body;
            const result = await UserDatabase.insertOne(user);
            res.send(result);
        })
        app.patch('/block/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }

            const updateDoc = {
                $set: {
                    Status: 'block'
                }

            };
            const result = await UserDatabase.updateOne(query, updateDoc);
            res.send(result);
        })
        app.patch('/active/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }

            const updateDoc = {
                $set: {
                    Status: 'Active'
                }

            };
            const result = await UserDatabase.updateOne(query, updateDoc);
            res.send(result);
        })
        app.patch('/volunteer/user/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }

            const updateDoc = {
                $set: {
                    Role: 'volunteer'
                }

            };
            const result = await UserDatabase.updateOne(query, updateDoc);
            res.send(result);
        });
        app.patch('/admin/man/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }

            const updateDoc = {
                $set: {
                    Role: 'admin'
                }

            };
            const result = await UserDatabase.updateOne(query, updateDoc);
            res.send(result);
        })
        app.get('/users', async (req, res) => {

            const result = await UserDatabase.find().toArray();
            res.send(result);
        })
        app.get('/user/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { Email: email }

            const result = await UserDatabase.findOne(query);
            res.send(result);
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is running')
})
app.listen(port, () => {
    console.log(`this is the port${port}`)
})