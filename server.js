const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy; // 여기서 LocalStrategy로 수정
const session = require("express-session");
const methodOverride = require("method-override");
const bcrypt = require("bcrypt");
const saltRounds = 10;
var db;
const path = require("path");
const { Script } = require("vm");
app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

// 데이터베이스와 연결
MongoClient.connect(
  "mongodb+srv://kyj0719:cottonjin719@mongodb-cluster.pgdbnph.mongodb.net/?retryWrites=true&w=majority&appName=mongodb-cluster",
  { useUnifiedTopology: true },
  function (에러, client) {
    if (에러) return console.log(에러);
    app.listen(8080, function () {
      console.log("listening on 8080");
    });
    db = client.db("todoapp");
  }
);
app.get("/images/:img", function (req, res) {
  res.sendFile(__dirname + "/images/" + req.params.img);
});
app.get("/write", doLogin, async (req, res) => {
  res.render("write.ejs", { user: req.user });
});
app.get("/list", doLogin, async (req, res) => {
  let result = await db
    .collection("post")
    .find()
    .sort({ DueDate: 1 })
    .toArray();
  res.render("list.ejs", { posts: result, user: req.user });
});
app.get("/", function (req, res) {
  res.render("index.ejs", { user: req.user });
});
app.get("/join", function (req, res) {
  res.render("join.ejs", {
    user: req.user,
    errorMessage: "",
    userName: "",
    userEmailID: "",
    userPW: "",
    cpassword: "",
  });
});
app.get("/login", function (req, res) {
  res.render("login.ejs", { user: req.user });
});
app.get("/mypage", doLogin, async (req, res) => {
  const result = await db
    .collection("post")
    .find()
    .sort({ DueDate: 1 })
    .toArray();
  res.render("mypage.ejs", {
    user: req.user,
    posts: result,
  });
});
app.get("/fail", function (req, res) {
  res.render("fail.ejs");
});
app.get("/failchecking", function (req, res) {
  res.render("failchecking.ejs");
});

app.get("/detail/:id", doLogin, async (req, res) => {
  const result = await db.collection("post").findOne({ _id: +req.params.id });
  if (result) {
    res.status(200).render("detail.ejs", {
      post: result,
      user: req.user,
    });
  } else {
    req.status(400).render("detail.ejs", {
      error: "The post is not found",
      user: req.user ? req.user.id : undefined,
    });
  }
});
app.get("/mypage/myDoneList", doLogin, async (req, res) => {
  const result = await db
    .collection("post")
    .find()
    .sort({ DueDate: 1 })
    .toArray();
  res.render("mypageDonelist.ejs", {
    user: req.user,
    posts: result,
  });
});

app.get("/mypage/account", doLogin, async (req, res) => {
  res.render("mypageAccount.ejs", {
    user: req.user,
  });
});

function ensureVerifiedForEditAccount(req, res, next) {
  if (req.session.isVerifiedForEditAccount) {
    next();
  } else {
    res.redirect("/mypage/editAccountCheck");
  }
}

function clearEditAccountVerification(req, res, next) {
  if (
    req.path !== "/mypage/editAccountCheckAction" &&
    req.path !== "/mypage/editAccount"
  ) {
    req.session.isVerifiedForEditAccount = false;
  }
  next();
}

app.get(
  "/mypage/editAccount",
  doLogin,
  ensureVerifiedForEditAccount,
  async (req, res) => {
    res.render("editAccount.ejs", {
      user: req.user,
    });
  }
);

// 모든 요청에 대해 권한 삭제 체크
app.use(clearEditAccountVerification);

// 마이페이지에서 계정 수정 시
app.get("/mypage/editAccountCheck", doLogin, function (req, res) {
  res.render("editAccountCheck.ejs", { user: req.user });
});

app.post("/mypage/editAccountCheckAction", function (req, res) {
  var inputEmailID = req.user.userEmailID;
  var userPW = req.body.userPW;
  db.collection("member").findOne(
    { userEmailID: inputEmailID },
    function (err, user) {
      if (err) {
        console.log("데이터베이스 오류:", err);
        res.json({ message: "데이터베이스 오류" });
        return res.redirect("/mypage/editAccountCheck?flag=0");
      }
      if (!user) {
        console.log(inputEmailID);
        console.log("사용자를 찾을 수 없습니다.");
        console.json({ message: "사용자를 찾을 수 없습니다." });
        return res.redirect("/mypage/editAccountCheck?flag=1");
      }
      bcrypt.compare(userPW, req.user.userPW, function (err, isMatch) {
        if (err) {
          console.log("입력한 비밀번호: ", userPW);
          console.log("데이터베이스 비밀번호: ", req.user.userPW);
          console.log("비밀번호 비교 오류:", err);
          console.log("");
          res.json({ message: "비밀번호 비교 오류" });
          return res.redirect("/mypage/editAccountCheck?flag=2");
        }
        if (isMatch) {
          console.log("로그인 성공");
          req.session.isVerifiedForEditAccount = true;
          return res.redirect("/mypage/editAccount");
        } else {
          console.log("비밀번호가 틀렸습니다.");
          res.json({ message: "비밀번호가 틀렸습니다." });
          return res.redirect("/mypage/editAccountCheck?flag=3");
        }
      });
    }
  );
});

// 게시물 수정
app.get("/edit/:id", async (req, res) => {
  const result = await db.collection("post").findOne({ _id: +req.params.id });
  if (result) {
    res.status(200).render("edit.ejs", { post: result, user: req.user });
  } else {
    res
      .status(400)
      .render("edit.ejs", { error: "The post is not found", user: req.user });
  }
});
app.post("/edit/:id", async (req, res) => {
  const { title, detail, DueDate } = req.body;
  const id = parseInt(req.params.id);
  const {
    result: { nModified },
  } = await db.collection("post").updateOne(
    { _id: +id },
    {
      $set: {
        title: title,
        detail: detail,
        DueDate: DueDate,
        writeDate: getToday(),
      },
    }
  );
  if (nModified == 1) {
    res.redirect("/list");
  } else {
    res.status(400).send("Fail to modify the post.");
  }
});

//글 작성 기능
app.post("/add", (req, res) => {
  db.collection("counter").findOne(
    { name: "게시물 갯수" },
    function (error, 결과) {
      console.log(결과.totalPost);
      db.collection("post").insertOne(
        {
          _id: 결과.totalPost + 1,
          title: req.body.title,
          detail: req.body.detail,
          DueDate: req.body.DueDate,
          nickname: req.user.nickname,
          ID: req.user.userEmailID,
          writeDate: getToday(),
          isDone: false,
        },
        function (에러, 결과) {
          console.log("저장완료");
          db.collection("counter").updateOne(
            { name: "게시물 갯수" },
            { $inc: { totalPost: 1 } },
            function (error, 결과) {
              if (error) {
                return console.log(error);
              }
            }
          );
        }
      );
      // 이걸로 add 페이지에 머물던 것 해결 (데이터 전송 후 리다이렉트되게 해야 새로고침 없이 데이터 확인 가능)
      res.redirect("/list");
    }
  );
});

// 완료 버튼 눌렀을 떄 (체크박스)
app.put("/update-status/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const result = await db
      .collection("post")
      .updateOne({ _id: postId }, { $set: { isDone: true } });

    if (result.modifiedCount === 1) {
      res.sendStatus(200);
    } else {
      res.sendStatus(500);
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// 글 삭제 기능
// AJAX로 구현함.
app.delete("/delete", function (req, res) {
  req.body._id = parseInt(req.body._id);
  db.collection("post").deleteOne(
    { _id: req.body._id },
    function (err, result) {
      if (err) {
        console.error("삭제 실패:", err);
        res.status(500).send("삭제 실패");
      } else {
        console.log("삭제 완료");
        res.status(200).send("삭제 완료");
      }
    }
  );
});

app.get("/edit", function (req, res) {});

// 회원가입 기능 수정
app.post("/joinAction", function (req, res) {
  var email = req.body.userEmailID;
  var name = req.body.userName;
  var nickname = req.body.nickname;
  var pw = req.body.userPW;
  var cpw = req.body.cpassword; // 비밀번호 확인 값

  if (pw !== cpw) {
    // 비밀번호가 일치하지 않으면
    console.error("비밀번호가 일치하지 않음");
    // 클라이언트에게 경고 메시지와 입력한 값들을 함께 전송합니다.
    res.render("join.ejs", {
      errorMessage: "비밀번호가 일치하지 않습니다.",
      userName: name,
      userEmailID: email,
      userPW: pw,
      cpassword: cpw,
    });
  } else {
    console.log("사용자 이름:", name);
    console.log("사용자 닉네임:", nickname);
    console.log("사용자 이메일:", email);
    console.log("비밀번호:", pw);
    bcrypt.hash(pw, saltRounds, (err, hashPassword) => {
      console.log("bcrypt SUCCESS");
      db.collection("member").insertOne(
        {
          userName: req.body.userName,
          nickname: req.body.nickname,
          userEmailID: req.body.userEmailID,
          userPW: hashPassword,
        },
        function (에러, 결과) {
          if (에러) {
            console.error("회원가입 에러:", 에러);
            res.status(500).send("회원가입 중 에러가 발생했습니다."); // 에러 발생 시 클라이언트에게 오류 메시지 전달
          } else {
            console.log("회원가입 완료");
            res.redirect("/login?signupSuccess=true"); // 회원가입 성공 메시지를 포함하여 로그인 페이지로 리다이렉트
          }
        }
      );
    });
  }
});

//로그인 기능
app.post(
  "/loginAction",
  passport.authenticate("local", { failureRedirect: "/fail" }),
  function (req, res) {
    res.redirect("/");
  }
);

// Passport 설정
passport.use(
  new LocalStrategy(
    {
      usernameField: "userEmailID",
      passwordField: "userPW",
      session: true,
      passReqToCallback: false,
    },
    function (inputEmailId, inputPw, done) {
      console.log("사용자 이메일:", inputEmailId);
      console.log("비밀번호:", inputPw);

      db.collection("member").findOne(
        { userEmailID: inputEmailId },
        function (err, user) {
          if (err) {
            console.log("데이터베이스 오류:", err);
            return done(err);
          }
          if (!user) {
            console.log("존재하지 않는 사용자입니다.");
            return done(null, false, {
              message: "존재하지 않는 사용자입니다.",
            });
          }
          bcrypt.compare(inputPw, user.userPW, function (err, isMatch) {
            if (err) {
              return done(err);
            }
            if (isMatch) {
              console.log("로그인 성공");
              return done(null, user);
            } else {
              console.log("비밀번호가 틀렸습니다.");
              return done(null, false, { message: "비밀번호가 틀렸습니다." });
            }
          });
        }
      );
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.userEmailID);
});

passport.deserializeUser((userEmailID, done) => {
  db.collection("member").findOne({ userEmailID: userEmailID }, (err, user) => {
    if (err) {
      return done(err);
    }
    done(null, user); // 사용자를 역직렬화합니다.
  });
});

function doLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.write(
      "<script type=\"text/javascript\">alert('LogIn First Please')</script>"
    );
    res.write('<script>window.location="/login"</script>');
  }
}

// 이메일 중복 확인 기능
app.post("/duplicateID", function (req, res) {
  db.collection("member").findOne(req.body, function (error, result) {
    if (result) {
      res.json({ message: "중복된 이메일입니다." });
    } else {
      res.json({ message: "사용 가능한 이메일입니다." });
    }
  });
});

// 아이디 중복 확인 기능
app.post("/duplicateNickname", function (req, res) {
  db.collection("member").findOne(req.body, function (error, result) {
    if (result) {
      res.json({ message: "중복된 닉네임입니다." });
    } else {
      res.json({ message: "사용 가능한 닉네임입니다." });
    }
  });
});
// 로그아웃 기능
app.post("/logout", (req, res) => {
  req.session.destroy(); // 세션 파기
  res.redirect("/");
});

function getToday() {
  var date = new Date();
  var year = date.getFullYear();
  var month = ("0" + (1 + date.getMonth())).slice(-2);
  var day = ("0" + date.getDate()).slice(-2);
  var time = date.getHours();
  var min = date.getMinutes();
  var sec = date.getSeconds();
  return year + "/" + month + "/" + day + " " + time + ":" + min + ":" + sec;
}
