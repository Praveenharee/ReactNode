
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  "akondfasfdoiwned()asdasndjnanwd{}adc[]]Adsnwnii1232nlka213213kanskdcniwai213124r2314e";



const renewTokenMiddleware = async (req, res, next) => {

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

 if (!token) {
   return res.status(401).json({ message: "Unauthorized" });
 }

 try {
   const decoded = jwt.verify(token, JWT_SECRET);

   const newToken = jwt.sign({ email: decoded.email }, JWT_SECRET, {
     //expiresIn: "1h",
   });

   //res.setHeader("Authorization", "Bearer " + newToken);
   //res.status(200).json({ status: "ok", token: newToken });

   req.newToken = newToken;
   next();
 } catch (err) {
   console.error(err);
   res.status(500).send("An error occurred while renewing the token.");
 }
};

module.exports = renewTokenMiddleware;