const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000
require('dotenv').config()
const cors =require('cors')

// middleware
app.use(cors())
app.use(express.json())

const jwtVerify =(req,res,next) =>{
  const authorization =req.headers.authorization
  if(!authorization){
    return res.status(401).send({error:true,message:'unauthorized access'})
  }
  // bearer token
  const token =authorization.split(' ')[1]
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).send({error:true,message:'unauthorized access'})
    }
    req.decoded =decoded
    next()
  })

}

// mongodb configuration 

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2veuzlp.mongodb.net/?retryWrites=true&w=majority`;

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

    const courseCollection= client.db('Education').collection('course')
    const courseCartCollection= client.db('Education').collection('courseCart')
    const usersCollection = client.db("Education").collection("users");


    app.post('/jwt',(req,res)=>{
      const user=req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1h' });
      res.send({token})

    })

    // Warning: use verifyJWT before using verifyAdmin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }
    
    // insert a book to the database :post method

    app.post('/courses',async(req,res)=>{
        const data =req.body
        const result =await courseCollection.insertOne(data)
        res.send(result)
  
  
      })
  
      // get all books from database
  
      // app.get('/all-books',async(req,res)=>{
      //   const book =await bookCollection.find().toArray();
      //   res.send(book)
      // })
  
      // update a book data:patch or update methods
      app.patch('/courses/:id',async(req,res)=>{
        const id =req.params.id
        console.log(id)
        const updateCourseData =req.body
        const filter ={_id: new ObjectId(id)}
        const updateDoc ={
          $set:{
            ...updateCourseData,
          }
        }
          // update
          const result =await courseCollection.updateOne(filter,updateDoc)
          res.send(result)
        
      })
  
      // delete a book data
  
      app.delete('/courses/:id',async(req,res)=>{
        const id =req.params.id
        const filter ={_id: new ObjectId(id)}
        const result =await courseCollection.deleteOne(filter)
        res.send(result)
      })
  
      // find by category
  
      app.get('/courses',async(req,res)=>{
        let query={}
        if(req.query?.category){
          query={category:req.query.category}
  
        }
        const result =await courseCollection.find(query).toArray()
        res.send(result)
      })
  
      // to get a single book
  
      app.get('/courses/:id',async(req,res)=>{
        const id = req.params.id
        const filter ={ _id: new ObjectId (id)}
        const result =await courseCollection.findOne(filter)
        res.send(result)
  
      }) 
  
        // reviews related
        app.get('/Reviews',async(req,res)=>{
          const result =await reviewCollection.find().toArray();
          res.send(result)
      })

       // cart collection cart relate api

       app.get('/carts',jwtVerify,async(req,res)=>{
        const email =req.query.email
        if(!email){
          res.send([])
        }
  
        const decodedEmail =req.decoded.email
        if(email !== decodedEmail){
          return res.status(403).send({error:true,message:'forbidden access'})
        }
  
        const query = { email: email };
        const result =await courseCartCollection.find(query).toArray();
        res.send(result)
  
  
      })
  



      app.post('/carts',async(req,res)=>{
        const course = req.body
        console.log(course)
        const result = await courseCartCollection.insertOne(course);
        res.send(result)
      })
  
     app.delete('/carts/:id',async(req,res)=>{
      const id =req.params.id
      const query = { _id: new ObjectId (id) };
      const result = await courseCartCollection.deleteOne(query);
      res.send(result)
    })

    // user collection related api

    app.get('/users',jwtVerify,verifyAdmin,async(req,res)=>{
      const result =await usersCollection.find().toArray()
      res.send(result)
    })

    app.post('/users',async(req,res)=>{
      const user =req.body
      console.log(user)
      const query ={email:user.email}
      const existingUser =await usersCollection.findOne(query)
      console.log('existing User',existingUser)
      if(existingUser){
        return res.send({message:'user already exists'})
      }
     
      const result =await usersCollection.insertOne(user);
      res.send(result)
    })

      // security layer=verify jwt
    // email same
    // check admin
    app.get('/users/admin/:email',jwtVerify,async(req,res)=>{
      const email =req.params.email 

        if(req.decoded.email !== email){
          res.send({admin: false})
        }

      const query ={email: email}
      const user =await usersCollection.findOne(query)
      const result ={admin: user?.role === 'admin'}
      res.send(result)
    })


    app.patch('/users/admin/:id',async(req,res)=>{
      const id =req.params.id
      const filter = { _id: new ObjectId (id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result)
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
  res.send('Education server is running')
})

app.listen(port, () => {
  console.log(`Education server is running on port: ${port}`)
})