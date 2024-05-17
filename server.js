const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;
MongoClient.connect(
  "mongodb://localhost:27017/mongodb-cluster",
  function (에러, client) {
    if (에러) return console.log(에러);
    // listen(서버 띄울 포트 번호, 띄운 후 실행할 코드)
    app.listen(8080, function () {
      console.log("listening on 8080");
    });
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
