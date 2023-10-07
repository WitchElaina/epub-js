import express from 'express';
import { getObjectsFlat } from './s3';

const app = express();

app.get('/list', async (req, res) => {
  getObjectsFlat()
    .then((files) => {
      res.send(files);
    })
    .catch((err) => {
      res.send(err);
    });
});

app.listen(3131, () => {
  console.log('localhost:3131');
});
