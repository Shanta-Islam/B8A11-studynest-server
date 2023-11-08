const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParse = require('cookie-parser');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors(
  {
    origin: [
      'http://localhost:5173',
    ],
    credentials: true
  }
));
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.onvejqf.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const logger = (req, res, next) => {
  console.log('log: info', req.method, req.url);
  next();
}
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log('token in the middleware', token);
  // no token available 
  if (!token) {
      return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
      }
      req.user = decoded;
      next();
  })

}
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const assignmentsCollection = client.db('studyNest').collection('assignments');
    const submittedAssignmentCollection = client.db('studyNest').collection('submittedAssignments');
    const markedAssignmentCollection = client.db('studyNest').collection('markedAssignment');


     // auth related api
    app.post('/jwt', logger, async (req, res) => {
      const user = req.body;
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
        .send({ success: true })
    })


    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging out', user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    })
    app.get('/assignments', async (req, res) => {
      const query = {};
      const cursor = await assignmentsCollection.find(query);
      const assignments = await cursor.toArray();
      res.send(assignments);
    });
    app.get('/assignmentsCount', async (req, res) => {
      const count = await assignmentsCollection.estimatedDocumentCount();
      res.send({ count });
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
      if (req.query?.status) {
        query = { statusValue: req.query.status }
      }
      const result = await submittedAssignmentCollection.find(query).toArray();
      // console.log(storeProducts)
      res.send(result);
      // console.log(result)
    })
    app.get('/marked-assignment', logger, verifyToken, async (req, res) => {
      console.log('owner info', req.user);
      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      let query = {};
      if (req.query?.email) {
        query = { ExamineeEmail: req.query.email }
      }
      const result = await markedAssignmentCollection.find(query).toArray();
      res.send(result);
      // console.log(result)

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
    });

    app.post('/marked-assignment', async (req, res) => {
      const markedAssign = req.body;
      const result = await markedAssignmentCollection.insertOne(markedAssign);
      res.send(result);
    });

    app.patch('/submitted-assignment/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedStatus = req.body;
      const statusSet = {
        $set: {
          statusValue: updatedStatus.statusValue
        }
      }
      const result = await submittedAssignmentCollection.updateOne(filter, statusSet);
      res.send(result);
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

    app.delete('/delete-assignment/:id', async (req, res) => {
      const id = req.params.id;
      // const assignment = await assignmentsCollection.findOneAndDelete({ _id: new ObjectId(id), email: req.query?.email });
      // res.send(assignment);

      // console.log(assignment)
      try {
        const assignment = await assignmentsCollection.findOneAndDelete({ _id: new ObjectId(id), email: req.query?.email });
        if (assignment) {
          res.send(assignment);
        } else {
          res.status(404).json({ message: 'Product not found for the requesting user' });
        }
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
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