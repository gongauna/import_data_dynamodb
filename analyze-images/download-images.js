const fs = require('fs');
const AWS = require('aws-sdk');
const path = require('path');

// Configure AWS SDK with your credentials and region
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

const s3 = new AWS.S3();

// Function to download the file from S3
function downloadFileFromS3(bucketName, s3Key, localPath) {
    const params = {
        Bucket: bucketName,
        Key: s3Key
    };

    const file = fs.createWriteStream(localPath);

    s3.getObject(params).createReadStream().pipe(file).on('close', () => {
        console.log(`Downloaded ${s3Key} to ${localPath}`);
    }).on('error', (err) => {
        console.error(`Failed to download ${s3Key}: ${err.message}`);
    });
}

// Function to process the JSON file
function processJsonFile(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Failed to read file: ${err.message}`);
            return;
        }

        const jsonArray = JSON.parse(data);

        // Create selfies_images folder if it doesn't exist
        const outputDir = path.join(__dirname, 'back_images_agosto');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        jsonArray.forEach(item => {
            const imageUrl = item.image_url;
            const bucketName = 'vana-user-images'; 

            // Extract the S3 key from image_url
            const s3Key = imageUrl;

            // Set local path to save the downloaded file
            const localPath = path.join(outputDir, path.basename(s3Key));//path.join(__dirname, path.basename(s3Key));

            // Download the file from S3
            downloadFileFromS3(bucketName, s3Key, localPath);
        });
    });
}

// Example usage: replace 'your-file.json' with the path to your JSON file
processJsonFile('stats-doc-analysis.json');
