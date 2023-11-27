const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
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
        await client.connect();

        const UserDatabase = client.db("BloodDonation").collection("userInfo");
        const division = client.db("BloodDonation").collection("division");
        const district = client.db("BloodDonation").collection("distict");
        const DonationRequest = client.db("BloodDonation").collection("DonationRequest");


        // DonationRequest api
        app.delete('/delete/:id', async (req, res) => {
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
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await DonationRequest.findOne(query);
            res.send(result);
        })
        app.patch('/request/cancel/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }

            const updateDoc = {
                $set: {
                    status: 'cancel'
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
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await UserDatabase.insertOne(user);
            res.send(result);
        })
        app.get('/users', async (req, res) => {
            const result = await UserDatabase.find().toArray();
            res.send(result);
        })
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { Email: email }
            console.log(email, query)
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