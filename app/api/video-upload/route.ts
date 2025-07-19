import { v2 as cloudinary, UploadStream } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

cloudinary.config({ 
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
    });

    interface CloudinaryUploadResult{
        public_id: string;
        bytes: number;
        duration?: number;
        [key:string]:any
    }

export async function POST(request: NextRequest){
     try {

         const {userId} = await auth();

    if(!userId){
        return NextResponse.json({error:"Unauthorized"}, {status:401})
    }

         if(
        !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
    ){
        return NextResponse.json({error: "Cloudinary credentials not found"}, {status:500})
    }


        const formdata = await request.formData();
        const file = formdata.get("File") as File | null;
        const title = formdata.get("title") as string;
        const description = formdata.get("description") as string;
        const originalsize = formdata.get("Original Size") as string;

        if(!file){
            return NextResponse.json({error: "File not found"}, {status:400})
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)


        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "video",
                        folder: "next-cloudinary-upload",
                        transformation: [
                            {quality: "auto", fetch_format: "mp4"},
                        ]
                    },
                    (error, result) => {
                        if(error) reject(error);
                            else resolve(result as CloudinaryUploadResult);
                    }
                )
                uploadStream.end(buffer)
            }
        )

        const video = await prisma.video.create({
            data:{
                title,
                description,
                publicId: result.public_id,
                originalsize: originalsize,
                compressedSize: String(result.bytes),
                duration: result.duration || 0
            }
        })
        return NextResponse.json(video)

    } catch (error) {
        console.log("Upload Video Failed",error);
        return NextResponse.json({error: "Upload Video Failed"}, {status:500})
      } finally{
        await prisma.$disconnect()
      }
}