const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');

// AWS S3 설정
const s3 = new S3Client({
    region: process.env.AWS_REGION, // 환경 변수에서 AWS Region 가져오기
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // 환경 변수에서 Access Key 가져오기
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // 환경 변수에서 Secret Key 가져오기
    },
});

// Multer 설정 (메모리 스토리지 사용)
const storage = multer.memoryStorage(); // 파일을 메모리에 저장
const upload = multer({ storage }); // multer 인스턴스 생성

// S3에 파일 업로드하는 함수
const uploadToS3 = async (file) => {
    console.log('Bucket Name:', process.env.AWS_BUCKET_NAME); // Bucket 이름 확인
    console.log('AWS Region:', process.env.AWS_REGION);

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME, // 환경 변수에서 S3 버킷 이름 가져오기
        Key: `images/${Date.now()}-${file.originalname}`, // 파일 경로 및 이름
        Body: file.buffer, // 메모리에 저장된 파일 데이터
        ContentType: file.mimetype, // MIME 타입
        ACL: 'public-read', // 파일을 공개 읽기 가능으로 설정
    };

    try {
        const command = new PutObjectCommand(params);
        const uploadResult = await s3.send(command);
        console.log('Upload Result:', uploadResult); // 반환값 로그

        const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
        console.log('File URL:', fileUrl); // 생성된 URL 로그
        return fileUrl;
    } catch (error) {
        console.error('Error uploading to S3:', error); // 에러 로그
        throw new Error('Failed to upload to S3');
    }
};

// S3에서 이미지 삭제하는 함수
const deleteImageFromS3 = async (imageUrl) => {
    const imageKey = imageUrl.split('.amazonaws.com/')[1]; // URL에서 S3 객체 키 추출

    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME, // 환경 변수에서 S3 버킷 이름 가져오기
        Key: imageKey,
    });

    try {
        await s3.send(command);
        console.log('Image deleted from S3');
    } catch (error) {
        console.error('Error deleting image from S3:', error);
        throw new Error('Failed to delete image from S3');
    }
};

module.exports = { upload, uploadToS3, deleteImageFromS3 };
