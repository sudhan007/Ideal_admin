import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand
} from "@aws-sdk/client-s3";



const s3 = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
    }
});

const bucketName = process.env.AWS_BUCKET_NAME as string;
const bucketRegion = process.env.AWS_REGION as string;


export async function uploadFileToS3(file: File, parentFolder: string, subFolder?: string): Promise<{ fullUrl: string, fileKey: string }> {
    if (!file) return { fullUrl: "", fileKey: "" };

try {
    const fileKey =subFolder ? `${parentFolder}/${subFolder}/${Date.now()}-${file.name}` : `${parentFolder}/${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();

    await s3.send(
        new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
            Body: Buffer.from(arrayBuffer),
            ContentType: file.type
        })
    );

    const baseUrl = process.env.IMAGE_BASE_URL as string;
    const fullUrl = `${baseUrl}/${fileKey}`;

    return {
        fullUrl,
        fileKey
    };
} catch (error) {
    console.log(error)
    return { fullUrl: "", fileKey: "" };
}
}


export async function deleteFileFromS3(fileKey: string): Promise<any> {
try {
       const command =  await s3.send(
        new DeleteObjectCommand({
            Bucket: bucketName,
            Key: fileKey
        })
    );
    console.log(command, 'command')
    return command
} catch (error) {
    
    console.log(error)
    return ""
}
}
