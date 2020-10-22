const express = require('express');
const cors = require('cors');
const multer = require('multer');
const azureStorage = require('azure-storage');
const getStream = require('into-stream');
const fnsFormat = require('date-fns/format');
const uuid = require('uuid');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const openApiDocumentation = require('./swagger');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const account = process.env.ACCOUNT;
const accountKey = process.env.ACCOUNT_KEY;
const containerName = 'ductt';
const blobService = azureStorage.createBlobService(`DefaultEndpointsProtocol=https;AccountName=${account};AccountKey=${accountKey};EndpointSuffix=core.windows.net`);
const inMemoryStorage = multer.memoryStorage();
const uploadStrategy = multer({ storage: inMemoryStorage, limits: { fileSize: 20 * 1024 * 1024 } }).single('resource');

function errorHandler (err, req, res, next) {
  res.status(500)
  res.render('error', { error: err })
}

const app = express();
app.use(cors());
app.use(errorHandler);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocumentation));

app.get('/health', function (req, res) {
   res.json({"ok": true});
})

const getBlobName = (file) => {
  return fnsFormat(new Date(), 'yyyy_MM_dd') + '-' + uuid.v4() + path.extname(file.originalname)
};

app.post('/upload', (req, res) => {
  uploadStrategy(req, res, (err) => {
    if (err) {
      console.warn(JSON.stringify(err));
    }
    if (err instanceof multer.MulterError) {
      res.status(400).json({
        uploaded: false,
        error: err.message,
      });
      return;
    } else if (err) {
      res.status(500).json({
        uploaded: false,
        error: 'Unknown error',
      })
      return;
    }
    const blobName = getBlobName(req.file);
    const stream = getStream(req.file.buffer);
    const streamLength = req.file.buffer.length;
    blobService.createBlockBlobFromStream(containerName, blobName, stream, streamLength, { contentSettings: { contentType: req.file.mimetype }}, (err) => {
      if(err) {
        res.status(502).json({
          uploaded: false,
          error: 'Fail in storage',
        })
        return;
      }
      const result = {
        container: containerName,
        blob: blobName,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: blobService.getUrl(containerName, blobName)
      }
      res.json({
        uploaded: true,
        result,
      })
    });
  });
});

app.use(errorHandler);

app.listen(8081, () => {
   console.log("Run")
})