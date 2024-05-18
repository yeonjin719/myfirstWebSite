const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const MongoClient = require("mongodb").MongoClient;
var db;
app.use(bodyParser.urlencoded({ extended: true }));
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

app.get("/home", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});
// app.get("/write", function (req, res) {
//   res.send("글을 쓸 수 있는 페이지 입니다.");
// });
app.get("/write", function (req, res) {
  res.sendFile(__dirname + "/write.html");
});

// '/' 하나는 홈화면이라는 뜻
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});
app.post("/add", (res, req) => {
  req.send("전송완료");
  console.log(res.body.title);
  db.collection("post").insertOne(
    { 할일: res.body.title, 세부사항: res.body.detail, _id: 2 },
    function (에러, 결과) {
      console.log("저장완료");
    }
  );
});
