import express from "express";
const app = express();
const port = 8000;

app.use(express.json());

app.post("/", (req, res) => {
  const { inputs } = req.body;

  const vector = inputs.map(() => [
    Math.random(),
    Math.random(),
    Math.random(),
  ]);

  res.json(vector);
});

app.listen(port, () => {
  console.log(`Mock service running at http://localhost:${port}`);
});
