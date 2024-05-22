const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy; // 여기서 LocalStrategy로 수정
const session = require("express-session");
const { message } = require("statuses");

var db;

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
app.get("/write", function (req, res) {
  res.render("write.ejs");
});
app.get("/list", async (request, response) => {
  let result = await db.collection("post").find().toArray();
  response.render("list.ejs", { posts: result });
});
app.get("/", function (req, res) {
  res.render("index.ejs");
});
app.get("/join", function (req, res) {
  res.render("join.ejs");
});
app.get("/login", function (req, res) {
  res.render("login.ejs");
});
app.get("/mypage", doLogin, function (req, res) {
  res.render("mypage.ejs", { user: req.user });
});
app.get("/fail", function (req, res) {
  res.send("로그인 실패. 다시 시도하세요.");
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
          할일: req.body.title,
          세부사항: req.body.detail,
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

// 회원가입 기능
app.post("/joinAction", function (req, res) {
  db.collection("member").insertOne(
    {
      userName: req.body.username,
      userEmailID: req.body.userEamilID,
      userPW: req.body.userPW,
    },
    function (에러, 결과) {
      console.log("회원가입 완료");
    }
  );
  res.redirect("/login");
});

//로그인 기능
app.post(
  "/loginAction",
  passport.authenticate("local", {
    failureRedirect: "/fail",
  }),
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
      console.log("사용자 이름:", inputEmailId);
      console.log("비밀번호:", inputPw);

      db.collection("member").findOne(
        { userEmailID: inputEmailId },
        function (err, result) {
          if (err) {
            console.log("데이터베이스 오류:", err);
            return done(err);
          }
          if (!result) {
            console.log("존재하지 않는 사용자입니다.");
            return done(null, false, {
              message: "존재하지 않는 사용자입니다.",
            });
          }
          if (inputPw === result.userPW) {
            console.log("인증 성공:", result);
            return done(null, result);
          } else {
            console.log("비밀번호가 틀렸습니다.");
            return done(null, false, { message: "비밀번호가 틀렸습니다." });
          }
        }
      );
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.userName);
});

passport.deserializeUser(function (userName, done) {
  db.collection("member").findOne({ userName: userName }, function (err, user) {
    done(err, user);
  });
});

// 글 삭제 기능
// AJAX로 구현함.
app.delete("/delete", function (req, res) {
  req.body._id = parseInt(req.body._id);
  db.collection("post").deleteOne(req.body, function (err, result) {
    if (err) {
      console.error("삭제 실패:", err);
      res.status(500).send("삭제 실패");
    } else {
      console.log("삭제 완료");
      res.status(200).send("삭제 완료");
    }
  });
});

function doLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send("로그인이 필요합니다.");
  }
}
