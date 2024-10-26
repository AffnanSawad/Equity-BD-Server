const express = require('express');
const app = express();
const cors = require('cors');
// jwt
const jwt =require('jsonwebtoken')
const cookieParser = require('cookie-parser');


require('dotenv').config()
const port = process.env.PORT || 5000;



// middleware
app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@atlascluster.5qhzsjb.mongodb.net/?retryWrites=true&w=majority&appName=AtlasCluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// jwt middlewares

const logger = (req,res,next)=>{

  console.log('log-info', req.method, req.url);

  next();
}

const verifyToken = (req,res,next)=>{

  const token = req?.cookies?.token;
  // console.log('token verify',token);
  if(!token){

    return res.status(401).send({message:'unauthorized access'})
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, (err,decoded)=>{
    
    if(err){

      return res.status(401).send({message:'unauthorized-access'});
    }

    req.user=decoded;

    next();


  })


}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const menuCollection = client.db("equityDb").collection("menu");
    const cartCollection = client.db("equityDb").collection("carts");
   

    // jwt related API Start here //
    
    app.post('/jwt',logger,verifyToken, async(req,res)=>{
      
      const user = req.body;
      console.log('user token', user);

      const token = jwt.sign(user, process.env.ACCESS_TOKEN,{expiresIn:'1h'});

      res.cookie('token', token, {

        httpOnly:true,
        secure:true,
        sameSite:'none'
      }).send({success:true})


    })


    app.post('/logout', async(req, res) => {
     
      const user = req.body;

      console.log('logoutinfo',user);

      res.clearCookie('token', { maxAge: 0 } ).send({success:true }) 
  })

  //  jwt related API Ends Here  //
  

    // data related api
    app.get('/menu', async(req, res) =>{
        const result = await menuCollection.find().toArray();
        res.send(result);
    })

    // user carts
    app.post('/carts',async(req,res)=>{

      const cartItem = req.body;

      const result = await cartCollection.insertOne(cartItem);

      res.send(result);
    })

    app.get('/carts',async(req,res)=>{
         
      const email = req.query.email;

      const query = {email: email};

      const result = await cartCollection.find(query).toArray();
        
      res.send(result);

    })

    // Cart delete in dashboard
    app.delete('/carts/:id', async (req, res) => {
      
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };


      const result = await cartCollection.deleteOne(query);
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
    res.send('Equity-BD-Server')
})

app.listen(port, () => {
    console.log(`Equity-BD-Server is running on port ${port}`);
})