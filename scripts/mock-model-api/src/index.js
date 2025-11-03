import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 8000;

app.use(express.json());

app.post('/', async (req, res) => {
    const { inputs } = req.body;

    const url = 'https://api.jina.ai/v1/embeddings';
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
    };

    const data = {
        model: 'jina-embeddings-v3',
        task: 'text-matching',
        dimensions: 1024,
        late_chunking: false,
        embedding_type: 'float',
        input: inputs,
    };

    const modelRes = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    });

    const json = await modelRes.json();
    const returnValue = json.data.map((doc) => doc.embedding);
    console.log(returnValue);
    res.send(returnValue);
});

app.listen(port, () => {
    console.log(`Mock service running at http://localhost:${port}`);
});
