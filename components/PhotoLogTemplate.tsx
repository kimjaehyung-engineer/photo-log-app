"use client";

import React from "react";

interface PhotoData {
  id: string;
  url: string;
  name: string;
  date: string;
  description: string;
  timestamp: number;
}

interface PhotoLogTemplateProps {
  photos: PhotoData[];
  projectName: string;
}

export default function PhotoLogTemplate({ photos, projectName }: PhotoLogTemplateProps) {
  // Group photos into chunks of 2 for each page (Standard A4 layout)
  const pageSize = 2;
  const pages = [];
  for (let i = 0; i < photos.length; i += pageSize) {
    pages.push(photos.slice(i, i + pageSize));
  }

  if (photos.length === 0) return null;

  return (
    <div id="photo-log-printable" className="no-print-container" style={{ overflow: "auto", maxHeight: "80vh", padding: "2rem", background: "rgba(0,0,0,0.3)", borderRadius: "12px" }}>
      <p style={{ textAlign: "center", color: "var(--muted-foreground)", marginBottom: "1rem" }}>출력물 미리보기 (A4 사이즈)</p>
      
      {pages.map((pagePhotos, pageIdx) => (
        <div key={pageIdx} className="photo-log-a4" style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "20px", 
          border: "1px solid #ddd",
          pageBreakAfter: "always" 
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "3px solid #333", paddingBottom: "10px", marginBottom: "10px" }}>
            <h1 style={{ fontSize: "24pt", fontWeight: "bold", margin: 0 }}>사 진 대 지</h1>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "10pt", margin: 0 }}>공 사 명: {projectName || "________________"}</p>
              <p style={{ fontSize: "10pt", margin: 0 }}>Page: {pageIdx + 1} / {pages.length}</p>
            </div>
          </div>

          {/* Photos */}
          <div style={{ display: "flex", flexDirection: "column", gap: "30px", flex: 1 }}>
            {pagePhotos.map((photo, idx) => (
              <div key={photo.id} style={{ border: "1px solid #333", display: "flex", flexDirection: "column" }}>
                <div style={{ width: "100%", height: "350px", overflow: "hidden", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={photo.url} alt={photo.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", borderTop: "1px solid #333" }}>
                  <div style={{ padding: "8px", background: "#f9f9f9", borderRight: "1px solid #333", fontWeight: "bold", textAlign: "center", fontSize: "11pt" }}>촬 영 일 시</div>
                  <div style={{ padding: "8px", fontSize: "11pt" }}>{photo.date}</div>
                  
                  <div style={{ padding: "8px", background: "#f9f9f9", borderRight: "1px solid #333", borderTop: "1px solid #333", fontWeight: "bold", textAlign: "center", fontSize: "11pt" }}>내 용</div>
                  <div style={{ padding: "8px", borderTop: "1px solid #333", fontSize: "11pt", minHeight: "60px" }}>{photo.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: "auto", borderTop: "1px solid #333", paddingTop: "10px", fontSize: "9pt", color: "#666", display: "flex", justifyContent: "space-between" }}>
            <span>Digital Photo Log System v1.0</span>
            <span>Generated on {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
