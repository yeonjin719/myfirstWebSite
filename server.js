const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const MongoClient = require("mongodb").MongoClient;
var db;
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", "./views");
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
      res.redirect("/list"); //이걸로 add 페이지에 머물던 것 해결
    }
  );
});

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
