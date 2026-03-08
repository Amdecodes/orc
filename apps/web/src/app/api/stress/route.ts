import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "No user found in DB" }, { status: 404 });

    const srcFront = "/home/amde/Documents/et-id-ocr-test/test img/photo_3_2026-02-27_00-06-59.jpg";
    const srcBack = "/home/amde/Documents/et-id-ocr-test/test img/photo_2_2026-02-27_00-06-59.jpg";
    const srcPhoto = "/home/amde/Documents/et-id-ocr-test/test img/photo_1_2026-02-27_00-06-59.jpg";

    if (!fs.existsSync(srcFront)) return NextResponse.json({ error: "Source images missing" }, { status: 400 });

    const jobIds = [];
    for (let i = 0; i < 3; i++) {
        const frontPath = `/tmp/stress_front_${Date.now()}_${i}.jpg`;
        const backPath = `/tmp/stress_back_${Date.now()}_${i}.jpg`;
        const photoPath = `/tmp/stress_photo_${Date.now()}_${i}.jpg`;
        
        fs.copyFileSync(srcFront, frontPath);
        fs.copyFileSync(srcBack, backPath);
        fs.copyFileSync(srcPhoto, photoPath);
        
        const job = await prisma.job.create({
            data: { 
                userId: user.id, 
                status: "PENDING", 
                cost: 0, 
                frontImagePath: frontPath, 
                backImagePath: backPath, 
                photoPath: photoPath,
                source: "WEB"
            }
        });
        jobIds.push(job.id);
    }
    
    return NextResponse.json({ success: true, count: 3, insertedJobs: jobIds });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
