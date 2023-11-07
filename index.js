const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.onvejqf.mongodb.net/?retryWrites=true&w=majority`;
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
    const assignmentsCollection = client.db('studyNest').collection('assignments');
    const submittedAssignmentCollection = client.db('studyNest').collection('submittedAssignments');
    const markedAssignmentCollection = client.db('studyNest').collection('markedAssignment');





    app.get('/assignments', async (req, res) => {
      const query = {};
      const cursor = assignmentsCollection.find(query);
      const assignments = await cursor.toArray();
      res.send(assignments);
    });
    app.get('/assignment-details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const product = await assignmentsCollection.findOne(query);
      res.send(product);

    })
    app.get('/submitted-assignment/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await submittedAssignmentCollection.findOne(query);
      res.send(result);

    })
    app.get('/submitted-assignment', async (req, res) => {
      let query = {};
      const result = await submittedAssignmentCollection.find(query).toArray();
      // console.log(storeProducts)
      res.send(result);

    })
    app.post('/assignments', async (req, res) => {
      const newAssignment = req.body;
      const result = await assignmentsCollection.insertOne(newAssignment);
      res.send(result);

    })
    app.post('/submitted-assignment', async (req, res) => {
      const submittedAssign = req.body;
      const result = await submittedAssignmentCollection.insertOne(submittedAssign);
      res.send(result);
      console.log(submittedAssign)
    });
    app.post('/marked-assignment', async (req, res) => {
      const markedAssign = req.body;
      const result = await markedAssignmentCollection.insertOne(markedAssign);
      res.send(result);
      console.log(markedAssign)
    });
    app.put('/updated-assignment/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      // let query = {};
      // if(req.query?.email){
      //   query = {email: req.query.email}
      // }
      const options = { upsert: true };
      const updatedAssignment = req.body;
      const assignment = {
        $set: {
          title: updatedAssignment.title,
          desc: updatedAssignment.desc,
          marks: updatedAssignment.marks,
          photo: updatedAssignment.photo,
          dLevel: updatedAssignment.dLevel,
          date: updatedAssignment.date
        }
      }
      const result = await assignmentsCollection.updateOne(filter, assignment, options);
      res.send(result);
    })
    app.delete('/delete-assignment/:email', async (req, res) => {
      const userEmail = req.params.email;
      const query = { email: userEmail };
      const result = await assignmentsCollection.deleteOne(query);
      res.send(result);

    })
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('studyNest making server is running')
})

app.listen(port, () => {
  console.log(`studyNest Server is running on port: ${port}`)
})