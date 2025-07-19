import { v2 as cloudinary, UploadStream } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';



cloudinary.config({ 
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
    });

    interface CloudinaryUploadResult{
        public_id: string;
        [key:string]:any
    }

export async function POST(request: NextRequest){
    const {userId} = await auth()

    if(!userId){
        return NextResponse.json({error:"Unauthorized"}, {status:401})
    }

    try {
        const formdata = await request.formData();
        const file = formdata.get("File") as File | null;

        if(!file){
            return NextResponse.json({error: "File not found"}, {status:400})
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)


        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {folder: "next-cloudinary-upload"},
                    (error, result) => {
                        if(error) reject(error);
                            else resolve(result as CloudinaryUploadResult);
                    }
                )
                uploadStream.end(buffer)
            }
        )

        return NextResponse.json(
            {
                publicId: result.public_id,
            },
            {
                status: 200
            }
        )

    } catch (error) {
        console.log("Upload Image Failed",error);
        return NextResponse.json({error: "Upload Image Failed"}, {status:500})
        
        
    }
}