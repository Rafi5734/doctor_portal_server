const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(
  "sk_test_51NBfETJEHFgRkHOuBbqtj9vzjBLvF3oaJSth6tuxCfjnstwiT1Kn8Ft0uT4ZFmu01QJLQ3yLHYrrnNfLahnPclpR000Q7MX8OY"
);
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const uri = `mongodb+srv://DaktarAdmin:BLjjQwTb5gTBLHRI@daktarbari.abvhg0c.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(
  "mongodb+srv://DaktarAdmin:BLjjQwTb5gTBLHRI@daktarbari.abvhg0c.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  }
);

// JWT
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(
    token,
    "529552d1775ec1a3216c994a23264cb7580b25bcef1b73ed9d5cd629bd74d0bb30badf2452b988145abd04ce5ea0dbbdd36fe37c06a55058e44cd94e9a0b2653",
    function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      req.decoded = decoded;
      next();
    }
  );
}
async function run() {
  try {
    await client.connect();
    console.log("db connected");

    const specialtyCollection = client
      .db("Daktar-bari")
      .collection("specialty");
    const healthPlansCollection = client
      .db("Daktar-bari")
      .collection("Health Plans");

    const subscriptionCollection = client
      .db("Daktar-bari")
      .collection("Subscriptions");
    const userCollection = client.db("Daktar-bari").collection("users");
    const medicineCollection = client.db("Daktar-bari").collection("medicine");
    const prescriptionCollection = client
      .db("Daktar-bari")
      .collection("Prescription");
    const orderCollection = client.db("Daktar-bari").collection("orders");
    const bookingCollection = client.db("Daktar-bari").collection("Bookings");
    const doctorCollection = client.db("Daktar-bari").collection("Doctors");
    const paymentCollection = client.db("Daktar-bari").collection("payments");
    // const bookingPaymentCollection = client
    //   .db("Daktar-bari")
    //   .collection("BookingPayments");

    // specialty
    app.get("/specialty", async (req, res) => {
      const query = {};
      const cursor = specialtyCollection.find(query);
      const specialty = await cursor.toArray();
      res.send(specialty);
    });
    // specialty
    app.get("/healthPlans", async (req, res) => {
      const query = {};
      const cursor = healthPlansCollection.find(query);
      const healthPlans = await cursor.toArray();
      res.send(healthPlans);
    });
    app.get("/healthPlans/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const healthPlans = await healthPlansCollection.findOne(query);
      res.send(healthPlans);
    });
    // Subscription
    app.post("/subscriptions", async (req, res) => {
      const subscription = req.body;
      const result = await subscriptionCollection.insertOne(subscription);
      res.send(result);
    });
    app.get("/subscriptions/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const subscription = await subscriptionCollection.findOne(query);
      res.send(subscription);
    });

    app.get("/subscriptions", verifyJWT, async (req, res) => {
      const customerEmail = req.query.customerEmail;
      // console.log(customerEmail);
      const decodedEmail = req.decoded.email;
      if (customerEmail === decodedEmail) {
        const query = { customerEmail: customerEmail };
        const bookedSubscription = await subscriptionCollection
          .find(query)
          .toArray();
        return res.send(bookedSubscription);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });
    // user
    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        "529552d1775ec1a3216c994a23264cb7580b25bcef1b73ed9d5cd629bd74d0bb30badf2452b988145abd04ce5ea0dbbdd36fe37c06a55058e44cd94e9a0b2653",
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });
    // Admin user
    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    });
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    // medicines
    app.post(
      "/medicine",
      /*verifyJWT,*/ async (req, res) => {
        const newMedicine = req.body;
        const result = await medicineCollection.insertOne(newMedicine);
        res.send(result);
      }
    );
    app.get("/medicine", async (req, res) => {
      const query = {};
      const cursor = medicineCollection.find(query);
      const medicine = await cursor.toArray();
      res.send(medicine);
    });

    app.get("/medicine/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const medicine = await medicineCollection.findOne(query);
      res.send(medicine);
    });
    app.delete("/medicine/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await medicineCollection.deleteOne(filter);
      res.send(result);
    });
    // orders
    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    app.get("/order/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const order = await orderCollection.findOne(query);
      res.send(order);
    });

    app.get("/order", verifyJWT, async (req, res) => {
      const customerEmail = req.query.customerEmail;
      // console.log(customerEmail);
      const decodedEmail = req.decoded.email;
      if (customerEmail === decodedEmail) {
        const query = { customerEmail: customerEmail };
        const bookedOrder = await orderCollection.find(query).toArray();
        return res.send(bookedOrder);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });
    // Booking
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });
    app.get("/booking/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const booking = await bookingCollection.findOne(query);
      res.send(booking);
    });
    app.get("/booking", verifyJWT, async (req, res) => {
      const customerEmail = req.query.customerEmail;
      // console.log(customerEmail);
      const decodedEmail = req.decoded.email;
      if (customerEmail === decodedEmail) {
        const query = { customerEmail: customerEmail };
        const bookedOrder = await bookingCollection.find(query).toArray();
        return res.send(bookedOrder);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });
    // booking payments
    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const order = req.body;
      const price = parseFloat(order.price);
      const amount = price * 100;
      console.log(order);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    app.patch("/booking/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const result = await paymentCollection.insertOne(payment);
      const updatedPayment = await bookingCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(updatedDoc);
    });
    // Order payments
    app.patch("/order/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const result = await paymentCollection.insertOne(payment);
      const updatedPayment = await orderCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(updatedDoc);
    });
    // Subscription payments

    app.patch("/subscriptions/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const result = await paymentCollection.insertOne(payment);
      const updatedPayment = await subscriptionCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(updatedDoc);
    });
    // Doctor's
    app.post("/doctor", async (req, res) => {
      const doctor = req.body;
      const result = await doctorCollection.insertOne(doctor);
      res.send(result);
    });

    app.get("/doctor/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const doctor = await doctorCollection.findOne(query);
      res.send(doctor);
    });

    app.get("/doctor", async (req, res) => {
      const query = {};
      const cursor = doctorCollection.find(query);
      const doctor = await cursor.toArray();
      res.send(doctor);
    });

    app.get("/doctor/category/:category", async (req, res) => {
      const category = req.params.category;
      const query = { category: category };
      const doctor = await doctorCollection.find(query).toArray();

      if (doctor) {
        res.send(doctor);
      } else {
        res.status(404).json({ error: "Doctor not found" });
      }
    });

    // Prescription
    app.post("/prescription", async (req, res) => {
      const newPrescription = req.body;
      const result = await prescriptionCollection.insertOne(newPrescription);
      res.send(result);
    });
    app.get("/prescription/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const prescription = await prescriptionCollection.findOne(query);
      res.send(prescription);
    });
    app.get("/prescription", verifyJWT, async (req, res) => {
      const customerEmail = req.query.customerEmail;
      // console.log(customerEmail);
      const decodedEmail = req.decoded.email;
      if (customerEmail === decodedEmail) {
        const query = { ptEmail: customerEmail };
        const myPrescription = await prescriptionCollection
          .find(query)
          .toArray();
        return res.send(myPrescription);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from wizzeHealth server");
});

app.get("/users");

app.listen(port, () => {
  console.log(`wizzeHealth app listening on port ${port}`);
});
