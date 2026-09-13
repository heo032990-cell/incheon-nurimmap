const fs=require('node:fs');
const sharp=require(process.env.SHARP_MODULE||'sharp');
const source=process.argv[2];if(!source)throw Error('Provide the approved original icon PNG path');
(async()=>{
 for(const [file,size] of [['assets/nurim-icon.png',512],['assets/nurim-icon-192.png',192],['assets/nurim-touch-icon.png',180],['favicon.png',96]])await sharp(source).resize(size,size).png({palette:true,colours:64,compressionLevel:9}).toFile(file);
 const sizes=[16,32,48],buffers=[];for(const size of sizes)buffers.push(await sharp(source).resize(size,size).png({palette:true,colours:64}).toBuffer());
 const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;
 buffers.forEach((png,i)=>{const p=6+16*i;header[p]=sizes[i];header[p+1]=sizes[i];header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(png.length,p+8);header.writeUInt32LE(offset,p+12);offset+=png.length;});
 fs.writeFileSync('favicon.ico',Buffer.concat([header,...buffers]));console.log('Prepared 96/180/192/512px PNGs and multi-size ICO.');
})().catch(e=>{console.error(e);process.exitCode=1;});
