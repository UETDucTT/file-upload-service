const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const { BlobServiceClient, StorageSharedKeyCredential  } = require("@azure/storage-blob");
const  { setLogLevel } =  require("@azure/logger");
setLogLevel("info");

if (process.env.NODE_ENV !== 'production') {
   require('dotenv').config();
 }

const account = process.env.ACCOUNT;
const accountKey = process.env.ACCOUNT_KEY;

const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${account}.blob.core.windows.net`,
  sharedKeyCredential
);

const app = express();
app.use(fileUpload({
   limits: { fileSize: 20 * 1024 * 1024 },
 }));

app.use(cors());

app.get('/', function (req, res) {
   res.json({"ok": true});
})

app.post('/upload', (req, res) => {
  console.log(req.files.resource.length)
  res.json({"ok": true});
})

app.listen(8081, () => {
   console.log("OK")
})