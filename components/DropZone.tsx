"use client";

import React, { useCallback, useState } from "react";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import exifr from "exifr";

interface PhotoData {
  id: string;
  url: string;
  name: string;
  date: string;
  description: string;
  timestamp: number;
}

interface DropZoneProps {
  onPhotosAdded: (photos: PhotoData[]) => void;
}

export default function DropZone({ onPhotosAdded }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newPhotos: PhotoData[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      try {
        // Extract EXIF data
        const metadata = await exifr.parse(file);
        const date = metadata?.DateTimeOriginal 
          ? new Date(metadata.DateTimeOriginal).toLocaleString() 
          : new Date(file.lastModified).toLocaleString();
        
        const timestamp = metadata?.DateTimeOriginal 
          ? new Date(metadata.DateTimeOriginal).getTime() 
          : file.lastModified;

        const url = URL.createObjectURL(file);
        
        newPhotos.push({
          id: Math.random().toString(36).substr(2, 9),
          url,
          name: file.name,
          date,
          description: "",
          timestamp
        });
      } catch (err) {
        console.error("Error processing file:", file.name, err);
        // Fallback to file date if EXIF fails
        const url = URL.createObjectURL(file);
        newPhotos.push({
          id: Math.random().toString(36).substr(2, 9),
          url,
          name: file.name,
          date: new Date(file.lastModified).toLocaleString(),
          description: "",
          timestamp: file.lastModified
        });
      }
    }

    onPhotosAdded(newPhotos);
    setIsProcessing(false);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [onPhotosAdded]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`glass drop-zone ${isDragging ? "active" : ""}`}
      style={{
        padding: "3rem",
        borderRadius: "var(--radius)",
        textAlign: "center",
        border: isDragging ? "2px dashed var(--primary)" : "2px dashed var(--border)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        marginBottom: "2rem"
      }}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <input
        id="file-input"
        type="file"
        multiple
        accept="image/*"
        onChange={onFileChange}
        style={{ display: "none" }}
      />
      
      {isProcessing ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
          <p>사진을 분석하고 있습니다... (EXIF 정보 추출 중)</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div className="icon-wrapper" style={{ 
            background: "rgba(99, 102, 241, 0.1)", 
            padding: "1rem", 
            borderRadius: "50%",
            color: "var(--primary)"
          }}>
            <Upload size={32} />
          </div>
          <h3>사진 파일 불러오기</h3>
          <p style={{ color: "var(--muted-foreground)" }}>
            탐색기에서 수십, 수백 장의 사진을 드래그하여 이곳에 놓으세요.<br />
            촬영 일시를 자동으로 추출하여 정리해 드립니다.
          </p>
          <button className="premium-button">파일 선택하기</button>
        </div>
      )}
    </div>
  );
}
