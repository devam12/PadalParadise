require('dotenv').config();
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const adminRoutes = require('./routes/adminRoutes')
const userRoutes = require('./routes/userRoutes')
const fileUpload = require('express-fileupload');
const UserModel = require('./models/user');
const BookBikeModel = require('./models/bookbike');
const BikeModel = require('./models/bike');
const bcrypt = require('bcrypt')
const path = require('path');
const jwt = require('jsonwebtoken');
const cors = require("cors");
const { generateAccessToken, generateRefreshToken, verifyAccessToken } = require('./middelware/auth')

//Call Functions 
const app = express()
const port = process.env.PORT || 3000


//Middelware
app.use(express.static(path.join(__dirname, "/views")))  //Automatic fatch index page using express.static()
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(fileUpload());
app.use(cors());


//Routes
app.use('/admin', adminRoutes)
app.use('/user', userRoutes)


//Methods
app.post('/login', async (req, res) => {
  try {
    email = req.body.email;
    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return res.status(401).send("User Not Found");
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password)
    if (isMatch) {
      const accesstoken = await generateAccessToken(user);
      const refreshtoken = await generateRefreshToken(user);

      res.send({ accesstoken: accesstoken, refreshtoken: refreshtoken }).json();
      console.log("login successfull");
    }
    else {
      res.status(401).send({ message: "Invalid password" });
    }
  }
  catch (error) {
    res.status(400).json({ message: error.message });
  }
})



//Update Booked Bike Status 
app.post('/updateBikeRentStatus', verifyAccessToken, async (req, res) => {
  try {
    const currdate = Date();
    const bike = await BookBikeModel.find({ dropDate: { $lt: currdate } });
    bike.forEach(async (currentBike, index, arr) => {
      const bike = await BikeModel.findById(currentBike.id);
      let changeStatus = { bRentStatus: "Available" };
      await BikeModel.updateOne(bike, changeStatus);
    })
  }
  catch (error) {
    res.status(400).json({ message: error.message })
  }
})


//Database Connection 
const mongoString = process.env.DATABASE_URL
mongoose.connect(mongoString, {
  useNewUrlParser: true,
});
const database = mongoose.connection
database.on('error', (error) => {
  console.log(error);
})
database.once('connected', () => {
  console.log('Database Connected');
})


//Start Application
app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}/admin/`)
})

module.exports = app;
