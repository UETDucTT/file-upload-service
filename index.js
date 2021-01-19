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
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');
const bodyParser = require('body-parser');

const { uploadImage } = require('./helpers')

const LIMIT = 50;

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const account = process.env.ACCOUNT;
const accountKey = process.env.ACCOUNT_KEY;
const containerName = 'ductt';
const blobService = azureStorage.createBlobService(`DefaultEndpointsProtocol=https;AccountName=${account};AccountKey=${accountKey};EndpointSuffix=core.windows.net`);
const inMemoryStorage = multer.memoryStorage();
const uploadStrategy = multer({ storage: inMemoryStorage, limits: { fileSize: LIMIT * 1024 * 1024 } }).single('resource');

function errorHandler (err, req, res, next) {
  res.status(500)
  res.render('error', { error: err })
}

const app = express();
app.use(cors());
app.use(errorHandler);
app.use(bodyParser.json())
app.use('/api', swaggerUi.serve, swaggerUi.setup(openApiDocumentation));

app.get('/health', function (req, res) {
   res.json({"ok": true});
})

const getBlobName = (file) => {
  return fnsFormat(new Date(), 'yyyy_MM_dd') + '-' + uuid.v4() + path.extname(file.originalname)
};

app.post('/upload', (req, res) => {
  uploadStrategy(req, res, (err) => {
    if (err) {
      console.error(err);
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

const uploadAWS = multer({
  storage: multerS3({
    s3: new AWS.S3({
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
      endpoint: 'fra1.digitaloceanspaces.com',
      signatureVersion: "v4",
    }),
    bucket: 'memospace',
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, getBlobName(file));
    }
  }),
  limits: { fileSize: LIMIT * 1024 * 1024 }
}).single('resource');

app.post('/upload/aws', function (req, res) {  
  uploadAWS(req, res, function(err) {
    if (err) {
      console.error(err);
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
    const result = {
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: req.file.key,
    };
    res.json({
      uploaded: true,
      result,
    });
  })
})

app.post('/upload/gcs', (req, res) => {
  uploadStrategy(req, res, async (err) => {
    if (err) {
      console.error(err);
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
    try {
      const myFile = req.file;
      const imageUrl = await uploadImage(myFile);
      const result = {
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: imageUrl,
      };
      res.json({
        uploaded: true,
        result,
      });
    } catch (err) {
      res.status(500).json({
        uploaded: false,
        error: 'Unknown error',
      });
    }
  })
});

app.use(errorHandler);

app.listen(8081, () => {
   console.log("Run")
})