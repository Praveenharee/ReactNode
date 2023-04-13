const express = require("express");//import express
const app = express();//initialize to app
const mongoose = require("mongoose");
app.use(express.json());
const cors = require("cors");
app.use(cors());
const bcrypt = require("bcryptjs");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
const jwt = require("jsonwebtoken");
const renewToken = require("./middlewares/renewTokenMiddleware");
const JWT_SECRET =
"akondfasfdoiwned()asdasndjnanwd{}adc[]]Adsnwnii1232nlka213213kanskdcniwai213124r2314e";



var nodemailer = require('nodemailer');

const mongoURL = "mongodb+srv://pvnhari2156:Praveenhari2000@cluster0.o6eatlm.mongodb.net/?retryWrites=true&w=majority";

mongoose
.connect(mongoURL, {
  useNewURLParser: true
})
.then(() => {
  console.log("Connected to database");
})
.catch(e => console.log(e));



require("./userDetails");


const User = mongoose.model("UserInfo");
const { Exam, Test, Subject } = require("./examSchema");
const UserTestResults = require("./takeTestSchema");

//const { name } = require("ejs");

// Send email function
async function sendEmail(message) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "linux2156@gmail.com",
      pass: "wuzecfhttfwnysvu",
    },
  });

  try {
    await transporter.sendMail(message);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email: ", error);
  }
}
//login API for Register User page
app.post("/register", async (req, res) => {
  const { fname, lname, email, password, phoneNumber, userType } = req.body;

  const encryptedPassword = await bcrypt.hash(password, 10);
  try {
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.send({ error: "User Exists" });
    }

    await User.create({
      fname,
      lname,
      email,
      phoneNumber,
      password: encryptedPassword,
      userType,
    });

    const admins = await User.find({ userType: "Admin" });

    // Call sendEmail function inside the loop
    for (const admin of admins) {
      const msg = {
        to: admin.email,
        from: "praveenhari1900@gmail.com",
        subject: "New user registered",
        text: `A new user ${fname} ${lname} (${email}) has registered with status 'pending'. Please verify their account.`,
        html: `<p>A new user <strong>${fname} ${lname}</strong> (${email}) has registered with status '<strong>pending</strong>'. As an admin, please <a href="http://localhost:3000/sign-in">login</a> and verify their account in more detailed view.</p>`,
      };

      try {
        await sendEmail(msg);
        console.log(`Email sent to ${admin.email}`);
      } catch (error) {
        console.error(
          `Error sending email to ${admin.email}: ${error.message}`
        );
      }
    }

    res.send({ status: "Registered" });
  } catch (error) {
    res.send({ error: error.message });
  }
});

//login API for login page
app.post("/login-user", async (req, res) => {
    const { email, password } = req.body;//request email, password

    const user = await User.findOne({ email });//check exist or not
    
    if (!user) {
        return res.json({ error: "User not exists" });
    }

    if (user.status === 'pending'){
      return res.json({
        error:
          "You are not a verified, please wait for admin to accept your Sign Up request!!!",
      });
    }

    else if (user.status === 'verified' && await bcrypt.compare(password, user.password)) {//compare password
        const token = jwt.sign({ email: user.email }, JWT_SECRET, {
            // expiresIn: "30s",
        });//create token with random digit above

        if (res.status(201)) {
            return res.json({ status: "ok", data: token });
        } else {
            return res.json({ error: "error" });
        }
    }
    res.json({ status: "error", error: "Invalid Password " });
});
//get data of user

app.post("/userData",  async (req, res) => {
    const { token } = req.body;
    try {
        const user = jwt.verify(token, JWT_SECRET, (err, res) => {
            if (err) {
                return "token expired";
            }
            return res;
        });
        console.log(user);
        if (user == "token expired") {
            return res.send({ status: "error", data: "token expired" });
        }

        const useremail = user.email;
        User.findOne({ email: useremail })
            .then((data) => {
                res.send({ status: "ok", data: data });
            })
            .catch((error) => {
                res.send({ status: "error", data: error });
            });
    } catch (error) { }

});

app.post("/getAllPendingUsers", async (req,res) => {
  try {
    const allPendingUsers = await User.find({status: "pending"})
    res.status(200).send({status: "ok" , data:allPendingUsers})
  } catch (error) {
     console.log(error)
     res.status(500).send("Error retrieving pending users");
  } 
})

app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const oldUser = await User.findOne({ email });
        if (!oldUser) {
            return res.json({ status: "User Not Existed" })
        }
        const secret = JWT_SECRET + oldUser.password;
        const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
            expiresIn: "5m",
        });
        const link = `http://localhost:5000/reset-password/${oldUser._id}/${token}`;
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "pvnhari2156@gmail.com",
                pass: "sbhnhsmavulqqgda",
            }
        });

        var mailOptions = {
            from: "youremail@gmail.com",
            to: "linux2156@gmail.com",
            subject: 'Password Reset',
            text:link,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        console.log(link);
    } catch (error) {
        console.log(error);
    }
});
app.get("/reset-password/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    console.log(req.params);
    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
        return res.json({ status: "User Not Existed" });
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        res.render("index", { email: verify.email ,status: "Not Verified" });
    } catch (error) {
        // console.log(error);
        res.send("Not Verified");
    }
   
});

app.post("/reset-password/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;

    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
        return res.json({ status: "User Not Existed" });
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        const encryptedPassword = await bcrypt.hash(password, 10);
        await User.updateOne(
            {
                _id: id,
            },
            {
                $set: {
                    password: encryptedPassword,
                },
            }
        );

        res.json({ status: "Password Updated" });
        
        res.render("index", { email: verify.email, status: "Verified" });
        // res.render('/login-user')
    } catch (error) {
        console.log(error);
        // res.json({ status: "Something Went Wrong" });
    }
});

app.get("/getAllUsers",   async(req,res) => {
    try {
        const allUser = await User.find({});
        res.send({status: "ok" , data:allUser})

    } catch (error) {
        console.log(error)
    }
});

app.post("/verifyUser", async(req,res) => {
  const { userid, email } = req.body;

  try {
    const user = await User.findByIdAndUpdate(userid, { status: "verified" });
    if (!user) {
      res.status(404).send("User not found");
    } else {
      const msg = {
        from: "praveenhari1900@gmail.com",
        to: email,
        subject: "Admin Verification Status",
        html: `<p>Your request to login at TestSoft Examination has been <strong>VERIFIED</strong> (<strong>${email}</strong>). Please use the same password you used to register earlier.</p>`,
      };
      try {
        sendEmail(msg);
        console.log(`Email sent to ${email}`);
      } catch (error) {
        console.error(
          `Error sending email to ${email}: ${error.message}`
        );
      }
      res.status(200).send({ message: "User verified" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating user status");
  }
});

app.get("/paginatedUsers", async(req,res)=>{
  const allUser=await User.find({});
  const page = parseInt(req.query.page)
  const limit = parseInt(req.query.limit)
  const startIndex=(page-1)*limit
  const lastIndex= (page)*limit
  
  const results={}
  results.totalUser=allUser.length;
  results.pageCount= Math.ceil(allUser.length/limit);
  
  if(lastIndex<allUser.length){
  results.next={
    page:page+1,
  }
}
  if(startIndex>0){
  results.prev = {
    page: page - 1,
  }
}
  
  results.result = allUser.slice(startIndex,lastIndex);

  res.json(results);
});

app.delete("/deleteUser", async  (req,res) => {
   const {userid} = req.body;
    try {
        await User.findByIdAndDelete({ _id: userid });
        
        res.send({ status: "Ok", data: "Deleted" });
        //res.send({status : "User Deleted!!"});
        //res.send({ status: "OK" , data : "Deleted" });
    } catch (error) {
        console.log(error);
    }
});

app.post("/updateProfile/:id", renewToken , async(req, res) => {

    const { fname, lname, password } = req.body;
    const encryptedPassword = await bcrypt.hash(password, 10);
    const newToken = req.newToken;
    try {
      const id = req.params.id;
     
      const data = await User.findByIdAndUpdate(
        id,
        {
          fname: fname,
          lname: lname,
          password: encryptedPassword,
        },
        { new: true }
      );
        console.log(newToken);
      if (!data) {
        return res.status(404).send("User not found");
      }
   

      return res.status(200).json({ status: "ok", data: data , token : newToken});
      
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .send("An error occurred while updating the profile.");
    }

  
});

app.post("/createUser", async (req,res) => {
    const { fname, lname, email, password, userType } = req.body;
    //const { fname, lname, email, phoneNumber, password, userType } = req.body;

    const encryptedPassword = await bcrypt.hash(password, 10);
    try {
        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.send({ error: "User Exists" });
        }
        await User.create({
            fname,
            lname,
            email,
            password: encryptedPassword,
            userType,                
        });
        User.save();
        

    } catch (error) {
        res.send({ status: "User Created" });
    }
});

app.post('/createExam', async (req, res) => {
  try {
    const { subject, test } = req.body;
    const subjectExists = await Subject.exists({ name: subject.name });
    if (subjectExists) {
      const existingSubject = await Subject.findOne({ name: subject.name });
      const existingTest = existingSubject.tests.find(t => t.name === test.name);
      if (existingTest) {
        const exam = new Exam({ subject: existingSubject._id, test: existingTest._id });
        await exam.save();
        res.json({ status: "New Test Created", success: true, exam });
       
      } else {
        const newTest = new Test(test);
        await newTest.save();
        existingSubject.tests.push(newTest);
        await existingSubject.save();
        const exam = new Exam({ subject: existingSubject._id, test: newTest._id });
        await exam.save();
        res.json({status: "New Test Created", success: true, exam });
       
        
      }
    } else {
      const newTest = new Test(test);
      const newSubject = new Subject({ name: subject.name, tests: [newTest] });
      await newTest.save();
      await newSubject.save();
      const exam = new Exam({ subject: newSubject._id, test: newTest._id });
      await exam.save();
      res.json({ status: "New Test and Subject Created", success: true, exam });
   
    }
  } catch (err) {
    console.error(err);
  
  }
});

app.get("/subjects", async (req, res) => {
  try {
    const allSubjects = await Subject.find();
    res.send({status: "ok" , data: allSubjects});
  } catch (error) {
    console.log(error);

  }
});

app.get("/subjects/:subjectName/tests", async (req, res) => {
  try {
    const { subjectName } = req.params;
    const subject = await Subject.findOne({ name: subjectName }).populate('tests');
    if(!subject){
        console.log("No subject");
        console.log(subjectName);
    }
   // const tests = await subjectName.find();
   console.log(subjectName);
    res.send({ status: "ok", data: subject.tests });
  } catch (error) {
    console.log(error);
  }
});

app.delete("/deleteSubject", async (req, res) => {
  const { subjectid } = req.body;
  try {
    await Subject.findByIdAndDelete({ _id: subjectid });

    res.send({ status: "Ok", data: "Deleted" });
    //res.send({status : "User Deleted!!"});
    //res.send({ status: "OK" , data : "Deleted" });
  } catch (error) {
    console.log(error);
  }
});

app.delete("/deleteTest", async (req, res) => {
  const { testid } = req.body;
  
  try {
    const result = await Test.findByIdAndDelete( {_id: testid});
    if (!result) {
      return res.status(404).send({ status: "Error", data: "Test not found" });
    }
  const subjectResult = await Subject.findOneAndUpdate(
    { "tests._id": testid },
    { $pull: { tests: { _id: testid } } },
    { new: true }
  );
  if (!subjectResult) {
    return res.status(404).send({ status: "Error", data: "Subject not found" });
  }

    return res.send({ status: "Ok", data: "Deleted" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ status: "Error", data: "Internal Server Error" });
  }
});



//display Questions
app.get("/subjects/:subject/tests/:testid", async (req, res) => {
  try {
    const { testid } = req.params;
    console.log(testid);
    const test = await Test.findOne({ _id: testid });
    const formattedTest = {
      id: test._id,
      name: test.name,
      date: test.date,
      timeLimit: test.timeLimit,
      questions: test.questions,
    };
    console.log(formattedTest);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }
    res.json({ status: "ok", data: formattedTest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/deleteQuestions", async (req, res) => {
  const { questionid } = req.body;
  try {
    await Test.question.findByIdAndDelete({ _id: questionid });

    res.send({ status: "Ok", data: "Deleted" });
    //res.send({status : "User Deleted!!"});
    //res.send({ status: "OK" , data : "Deleted" });
  } catch (error) {
    console.log(error);
  }
});

//studentsAPI
app.get("/subTests", async (req, res) => {
  try {
    const subjects = await Subject.find().populate("tests");
    const tests = subjects.reduce(
      (acc, subject) => [//accumulates data
        ...acc,
        ...subject.tests.map((test) => ({
          ...test.toObject(),
          subject: subject.name,
        })),
      ],
      []
    );
    res.json({ data: tests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/studentViewTest/:testid", async (req, res) => {
  try {
    const { testid } = req.params;
    console.log(testid);
    const test = await Test.findOne({ _id: testid });
    const formattedQuestions = test.questions.map(({ question, options }) => ({
      question,
      options,
    }));
    const formattedTest = {
      id: test._id,
      name: test.name,
      date: test.date,
      timeLimit: test.timeLimit,
      questions: formattedQuestions,
    };
    console.log(formattedTest);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }
    res.json({ status: "ok", data: formattedTest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/:id/:subjectname/tests/:taketestid/submit", async (req, res) => {
  const userId = JSON.parse(req.params.id).id;
  const testId = req.params.taketestid;
  const { answers } = req.body;
  const userAnswers = Object.values(answers);
  const subName = req.params.subjectname;
  console.log(subName);
  const test = await Test.findById(testId);
  const studentName = await User.findById(userId, "fname lname");
  const testName = await Test.findById(testId, "name");
  console.log(studentName);
  console.log(testName);

  const existingResult = await UserTestResults.findOne({
    user: userId,
    test: testId,
  });
  if (existingResult) {
    console.log("User has already taken the test");
    return res.status(400).send({ message:"You already taken the test"});
  }

  let score = 0;
  test.questions.forEach((question, index) => {
    console.log(`Answer ${index + 1}: ${question.answer}`);
    if (userAnswers[index] === question.answer) {
      score++;
    }
  });
  let TotalPercentageScore = (score / test.questions.length) * 100;
  console.log(userId);
  console.log(testId);
  console.log(userAnswers);
  console.log(`Score : ${score}/${test.questions.length}`);
  console.log(TotalPercentageScore);

  const userTestResult = new UserTestResults({
    user: userId,
    username: studentName,
    test: testId,
    testname: testName,
    subject: subName,
    score: score,
    percentageScore: TotalPercentageScore,
  });

  try {
    await userTestResult.save();
    res.status(200).send({message:"Test result saved successfully"});
  } catch (error) {
    console.log(error);
    res.status(500).send("Error saving test result");
  }
});

app.get("/getAllStudentResults", async (req,res) => { 
  try {
    const allStudentResults = await UserTestResults.find({});
    console.log(allStudentResults);

    res.status(200).send({ data: allStudentResults });      
  } catch (error) {
    
  }
})

// app.post("/getAllStudentResults", async (req,res) => {
//   try {
//     const allStudentResults = await UserTestResults.aggregate([
//       {
//         $lookup: {
//           from: "UserInfo",
//           localField: "user",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       {
//         $lookup: {
//           from: "Test",
//           localField: "test",
//           foreignField: "_id",
//           as: "test",
//         },
//       },
//       {
//         $project: {
//           _id: 1,
//           score: 1,
//           percentageScore: 1,
//           date: 1,
//           "user.fname": 1,
//           "test.name": 1,
//         },
//       },
//     ]);

//     console.log(allStudentResults);
//     res.status(200).send({ data: allStudentResults });
//   } catch (error) {
//     console.log(error);
//   }
  
//   })


// app.post("/getAllStudentResults", async (req,res) => {
//   try {
//       const  allStudentResults = await UserTestResults.find({})
//      const id = allStudentResults.map((result) => result.user);
//     //  const testName = allStudentResults.map((result) => result.test)
//      console.log(id);
//      const student = await User.find({
//       _id: { $in: id }
//      });
//      const fname = student.map((User) => User.fname);
//      console.log(fname);
     
//     //  const test = await Test.find({
//     //   _id: { $in: testName}
//     //  })
//     // const allStudentResults = await UserTestResults.find({})
//     //   .populate("user", "fname") // populate user field with name only
//     //   .populate("test", "name"); // populate test field with name onl

//      console.log(student);
//     // console.log(test);

//     res.status(200).send({ data: allStudentResults });
//   } catch (error) {
//     console.log(error);
//   }
// })


// app.post("/:id/:subjectname/tests/:taketestid/submit", async (req,res) => {
  
//      const userId = JSON.parse(req.params.id).id;
//      const testId = req.params.taketestid;
//      const { answers } = req.body;
//      const userAnswers= Object.values(answers);    
//      const test = await Test.findById(testId);

//       const existingResult = await UserTestResults.findOne({
//         user: userId,
//         test: testId,
//       });
//       if (existingResult) {
//         console.log("User has already taken the test");
//       }




//       let score = 0;
//      test.questions.forEach((question, index) => {
//        console.log(`Answer ${index + 1}: ${question.answer}`);
//        if (userAnswers[index] === question.answer){
//           score++;
//        }
//       });
//       let TotalPercentageScore = score/test.questions.length* 100;
//       console.log( userId );
//       console.log( userAnswers)
//       console.log( testId )
//       console.log(`Score : ${score}/${test.questions.length}`);
//       console.log(TotalPercentageScore);

//       const userTestResult = new UserTestResults({
//         user: userId,
//         test: testId,
//         score: score,
//         percentageScore: TotalPercentageScore,
//       });
//       userTestResult.save();
//     });
      
  //     try {
  //   // Get the test data from the database
  //   const test = await Test.findById(testId);
  //   if (!test) {
  //     return res.status(404).json({ error: 'Test not found' });
  //   }

  //   // Calculate the total marks obtained by the user
  //   let marksObtained = 0;
  //   for (let i = 0; i < test.questions.length; i++) {
  //     if (test.questions[i].answer === userAnswers[i]) {
  //       marksObtained++;
  //     }
  //   }

  //   // Create a new user test result document and save it in the database
  //   const userTestResult = new UserTestResults({
  //     user: userId,
  //     test: testId,
  //     userAnswers,
  //     marksObtained,
  //   });
  //   await userTestResult.save();

  //   return res.status(201).json({ message: 'User test result saved successfully' });
  // } catch (error) {
  //   console.error(error);
  //   return res.status(500).json({ error: 'Internal server error' });
  // }



// try {
//   const { id , subjectname , taketestid } = req.params;
//   const { userAnswers } = req.body;
// const subject = await Subject.findOne({ name: subjectname });
//   if (!subject) {
//     return res.status(400).json({ message: "Subject not found" });
//   }

//   const test = await Test.findOne({ _id: taketestid });
  
//   if (!test) {
//     return res.status(400).json({ message: "test not found" });
//   }

//   if (!test.questions || !test.questions.length) {
//     return res.status(400).json({ message: "test has no questions" });
//   }

//   if (userAnswers.length !== test.questions.length) {
//     return res
//       .status(400)
//       .json({
//         message:
//           "number of answers does not match number of questions in the test",
//       });
//   }


//   let score = 0;
//   for (let i = 0; i < test.questions.length; i++){
//     const question = await Test.findOne({ _id: userAnswers[i].question });
//     if (question.answer === userAnswers[i].userAnswer){
//       score++;
//     }
//   }

//   const results = (score / test.questions.length) * 100;

//   const userTestResult = new UserTestResults({
//     user: id,
//     test: test._id,
//     answer: userAnswers,
//     results,
//   });
//   await userTestResult.save();

//   res.json({ results });
// } catch (error){ 
//   console.log(error);
//   res.status(500).send("Server Error");
// }


// try{
  //   const { id , subjectname , taketestid } = req.params;
  //   const { userAnswers } = req.body;

  //   const subject = await Subject.findOne({ name: subjectname });
  //   if (!subject) {
  //     return res.status(400).json({ message: "Subject not found" });
  //   }

  //   const exam = await Exam.findOne({
  //     _id: taketestid,
  //   });
      
  //   let score = 0;
  //   for (let i = 0; i < userAnswers.length; i++){
  //     const question = await Test.findOne({ _id: userAnswers[i].question });
  //     if (question.answer === userAnswers[i].userAnswers){
  //       score++;
  //     }
  //   }
  //   const results = (score / exam.test.questions.length) * 100;

  //   const userTestResult = new UserTestResults({
  //     user: id,
  //     exam: exam._id,
  //     answer,
  //     results,
  //   });
  //   await userTestResult.save();

  //   res.json({ results });

  // }catch (error){ 
  //   console.log(error);
  //   res.status(500).send("Server Error");
  // }




// function adminOnly(req,res,next){
//     const userType =req.body.userType;
//     // Get the authorization header from the request
//     //const {userType} = req.body;
//     if (userType != "Tutor" || "Admin") {
//       // If no authorization header is provided, return an error response
//       return res
//         .status(401)
//         .json({ message: "Authorization header not provided" });
       
//     }else{
//         res.send("authenticated");
//         next();
//     }

// }


app.listen(5000, () => {
    console.log("Server Started");
});



