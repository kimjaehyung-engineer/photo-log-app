"use client";

import React from "react";
import { Trash2, Calendar, FileText, ChevronUp, ChevronDown } from "lucide-react";
import { motion, Reorder } from "framer-motion";

interface PhotoData {
  id: string;
  url: string;
  name: string;
  date: string;
  description: string;
  timestamp: number;
}

interface PhotoGridProps {
  photos: PhotoData[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoData[]>>;
}

export default function PhotoGrid({ photos, setPhotos }: PhotoGridProps) {
  const updatePhoto = (id: string, updates: Partial<PhotoData>) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const sortByDate = () => {
    setPhotos(prev => [...prev].sort((a, b) => a.timestamp - b.timestamp));
  };

  if (photos.length === 0) return null;

  return (
    <div className="photo-grid-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }}>업로드된 사진 ({photos.length}장)</h2>
        <button onClick={sortByDate} className="premium-button" style={{ background: "var(--secondary)" }}>
          <Calendar size={18} /> 날짜별 정렬하기
        </button>
      </div>

      <Reorder.Group axis="y" values={photos} onReorder={setPhotos} style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {photos.map((photo) => (
          <Reorder.Item
            key={photo.id}
            value={photo}
            whileDrag={{ scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}
            className="glass"
            style={{
              padding: "1rem",
              borderRadius: "var(--radius)",
              display: "grid",
              gridTemplateColumns: "120px 1fr auto",
              gap: "1.5rem",
              alignItems: "center"
            }}
          >
            <div style={{ width: "120px", height: "90px", borderRadius: "8px", overflow: "hidden" }}>
              <img src={photo.url} alt={photo.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                <Calendar size={14} />
                <input 
                  type="text" 
                  value={photo.date} 
                  onChange={(e) => updatePhoto(photo.id, { date: e.target.value })}
                  style={{ background: "none", border: "none", color: "inherit", width: "100%", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={16} color="var(--primary)" />
                <input 
                  type="text" 
                  placeholder="사진 내용을 입력하세요..." 
                  value={photo.description}
                  onChange={(e) => updatePhoto(photo.id, { description: e.target.value })}
                  style={{ 
                    background: "rgba(0,0,0,0.2)", 
                    border: "1px solid var(--border)", 
                    borderRadius: "4px", 
                    padding: "0.5rem", 
                    color: "white", 
                    width: "100%",
                    fontSize: "1rem"
                  }}
                />
              </div>
            </div>

            <button 
              onClick={() => removePhoto(photo.id)} 
              style={{ background: "none", border: "none", color: "var(--destructive)", cursor: "pointer", padding: "0.5rem" }}
            >
              <Trash2 size={20} />
            </button>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}
