const gc = require('./config')
const fnsFormat = require('date-fns/format');
const path = require('path');
const uuid = require('uuid');
const bucket = gc.bucket('ducttuet-111cc.appspot.com') // should be your bucket name

const getBlobName = (file) => {
  return fnsFormat(new Date(), 'yyyy_MM_dd') + '-' + uuid.v4() + path.extname(file.originalname)
};

/**
 *
 * @param { File } object file object that will be uploaded
 * @description - This function does the following
 * - It uploads a file to the image bucket on Google Cloud
 * - It accepts an object as an argument with the
 *   "originalname" and "buffer" as keys
 */

const uploadImage = (file) => new Promise((resolve, reject) => {
  const { buffer } = file

  const blob = bucket.file(getBlobName(file))
  const blobStream = blob.createWriteStream({
    resumable: false
  })
  blobStream.on('finish', () => {
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    resolve(publicUrl)
  })
  .on('error', () => {
    reject(`Unable to upload image, something went wrong`)
  })
  .end(buffer)
})

module.exports = {
  uploadImage,
}