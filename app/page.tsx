"use client";

import React, { useState, useRef } from "react";
import DropZone from "@/components/DropZone";
import PhotoGrid from "@/components/PhotoGrid";
import PhotoLogTemplate from "@/components/PhotoLogTemplate";
import { Download, FileText, Printer, Trash2, Camera, Settings2, Layout } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";

interface PhotoData {
  id: string;
  url: string;
  name: string;
  date: string;
  description: string;
  timestamp: number;
}

export default function Home() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [projectName, setProjectName] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [bulkDescription, setBulkDescription] = useState("");

  const addPhotos = (newPhotos: PhotoData[]) => {
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const clearAll = () => {
    if (confirm("모든 사진을 삭제하시겠습니까?")) {
      setPhotos([]);
    }
  };

  const applyBulkDescription = (onlyEmpty: boolean = false) => {
    if (!bulkDescription.trim()) {
      alert("입력할 내용을 먼저 작성해주세요.");
      return;
    }
    
    setPhotos(prev => prev.map(photo => {
      if (onlyEmpty && photo.description.trim()) return photo;
      return { ...photo, description: bulkDescription };
    }));
    
    alert(`총 ${photos.length}장의 사진에 내용이 적용되었습니다.`);
  };

  const exportToPDF = async () => {
    if (photos.length === 0) return;

    try {
      setIsExportingPDF(true);
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 210 * 4;
      canvas.height = 297 * 4;
      const scale = 4;

      for (let i = 0; i < photos.length; i += 2) {
        if (i > 0) doc.addPage();

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(scale, scale);

        // 1. 제목 (50% 축소)
        ctx.fillStyle = "#000000";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("사 진 대 지", 105, 12);

        for (let j = 0; j < 2; j++) {
          const photoIdx = i + j;
          if (photoIdx >= photos.length) break;
          const photo = photos[photoIdx];
          
          const yOffset = j === 0 ? 20 : 153; 

          // 외곽 프레임
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 0.3;
          ctx.strokeRect(10, yOffset, 190, 128); // 전체 블록
          ctx.strokeRect(10, yOffset, 190, 95);  // 사진 영역

          // 사진 배치
          try {
            const img = new Image();
            img.src = photo.url;
            img.crossOrigin = "anonymous";
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });

            const imgW = img.naturalWidth;
            const imgH = img.naturalHeight;
            const ratio = imgW / imgH;

            let drawW = 180;
            let drawH = 180 / ratio;
            if (drawH > 85) {
              drawH = 85;
              drawW = 85 * ratio;
            }

            const offX = 10 + (190 - drawW) / 2;
            const offY = yOffset + (95 - drawH) / 2;
            ctx.drawImage(img, offX, offY, drawW, drawH);
          } catch (err) {
            console.error("PDF Image Error", err);
          }

          // 텍스트 영역 설정 (글자 크기 50% 축소: 6px)
          ctx.font = "bold 6px sans-serif";
          ctx.textAlign = "left";
          
          // 촬영일시 (간격 넉넉히 배치)
          ctx.fillText("촬영일시 :", 15, yOffset + 104);
          ctx.font = "normal 6px sans-serif";
          ctx.fillText(photo.date || "-", 45, yOffset + 104);
          
          // 구분선
          ctx.beginPath();
          ctx.moveTo(10, yOffset + 112);
          ctx.lineTo(200, yOffset + 112);
          ctx.stroke();

          // 촬영내용
          ctx.font = "bold 6px sans-serif";
          ctx.fillText("촬영내용 :", 15, yOffset + 120);
          ctx.font = "normal 6px sans-serif";

          const desc = photo.description || "-";
          const maxWidth = 145;
          let line = "";
          let lineY = yOffset + 120;
          
          for (let n = 0; n < desc.length; n++) {
            const testLine = line + desc[n];
            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
              ctx.fillText(line, 45, lineY);
              line = desc[n];
              lineY += 4;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, 45, lineY);
        }

        const imgData = canvas.toDataURL("image/jpeg", 0.9);
        doc.addImage(imgData, "JPEG", 0, 0, 210, 297);
        ctx.restore();
      }

      const pdfOutput = doc.output("blob");
      const fileName = `사진대지_${new Date().toISOString().split("T")[0]}.pdf`;
      await saveFileWithPicker(pdfOutput, fileName, { 'application/pdf': ['.pdf'] });

    } catch (error) {
      console.error("PDF export failed:", error);
      alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const saveFileWithPicker = async (blob: Blob, suggestedName: string, accept: Record<string, string[]>) => {
    try {
      // Modern File System Access API
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName,
          types: [{
            description: 'Document',
            accept
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return true;
      console.error("File Picker Error:", err);
    }
    return false;
  };

  const exportToExcel = async () => {
    setIsExportingExcel(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("사진대지", {
        pageSetup: { 
          paperSize: 9, // A4
          orientation: 'portrait',
          margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0
        },
        views: [{ state: 'normal', showGridLines: false }]
      });

      // A4 가로 너비 최적화 (Column A + B = 80 units)
      worksheet.columns = [
        { width: 15 }, // A (Label)
        { width: 65 }, // B (Content/Image)
      ];

      // Header
      worksheet.mergeCells("A1:B1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "사 진 대 지";
      titleCell.font = { size: 20, bold: true };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getRow(1).height = 45;

      // Project Name Row
      worksheet.getRow(2).height = 25;
      worksheet.getCell("A2").value = "공사명";
      worksheet.getCell("A2").font = { bold: true };
      worksheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getCell("B2").value = projectName || "프로젝트 미지정";
      worksheet.getCell("B2").alignment = { vertical: "middle" };
      worksheet.getCell("B2").border = { bottom: { style: 'thin' } };
      
      let currentRow = 4;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        // Image Area (15 rows)
        const imageRowsCount = 15;
        for (let j = 0; j < imageRowsCount; j++) {
          worksheet.getRow(currentRow + j).height = 20; // Set explicit height for precision
        }
        
        worksheet.mergeCells(`A${currentRow}:B${currentRow + imageRowsCount - 1}`);
        const imageBox = worksheet.getCell(`A${currentRow}`);
        imageBox.border = {
          top: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' },
          bottom: { style: 'thin' }
        };

        try {
          const response = await fetch(photo.url);
          const buffer = await response.arrayBuffer();
          const imageId = workbook.addImage({
            buffer: buffer,
            extension: "jpeg",
          });

          // Pre-load image to get natural dimensions
          const img = new Image();
          img.src = photo.url;
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          const imgWidth = img.naturalWidth;
          const imgHeight = img.naturalHeight;
          
          // Calculate target area in pixels
          // 1 column unit approx 7.5px, 1 row point approx 1.33px
          const totalWidthPx = (15 + 65) * 7.5; 
          const totalHeightPx = imageRowsCount * 20 * 1.33;
          
          const imgAspectRatio = imgWidth / imgHeight;
          const boxAspectRatio = totalWidthPx / totalHeightPx;

          let drawWidth, drawHeight;
          if (imgAspectRatio > boxAspectRatio) {
            // Fit by width (95% of box width)
            drawWidth = totalWidthPx * 0.95;
            drawHeight = drawWidth / imgAspectRatio;
          } else {
            // Fit by height (95% of box height)
            drawHeight = totalHeightPx * 0.95;
            drawWidth = drawHeight * imgAspectRatio;
          }

          // Offsets for centering (EMU units: 1px = 9525 EMU)
          const EMU_PER_PIXEL = 9525;
          const offsetX = Math.max(0, (totalWidthPx - drawWidth) / 2) * EMU_PER_PIXEL;
          const offsetY = Math.max(0, (totalHeightPx - drawHeight) / 2) * EMU_PER_PIXEL;

          worksheet.addImage(imageId, {
            tl: { col: 0, row: currentRow - 1, colOff: offsetX, rowOff: offsetY } as any,
            ext: { width: drawWidth, height: drawHeight },
            editAs: 'oneCell'
          });
        } catch (e) {
          console.error("Image load failed", e);
        }

        currentRow += imageRowsCount;

        // Styles for Info Rows
        const labelStyle = { 
          font: { bold: true, size: 11 }, 
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } } as ExcelJS.Fill,
          alignment: { horizontal: 'center', vertical: 'middle' } as ExcelJS.Alignment,
          border: { 
            left: { style: 'medium' }, 
            right: { style: 'thin' }, 
            bottom: { style: 'thin' },
            top: { style: 'thin' }
          } as Partial<ExcelJS.Borders>
        };

        const contentStyle = {
          font: { size: 11 },
          alignment: { vertical: 'middle', wrapText: true, indent: 1 } as ExcelJS.Alignment,
          border: { 
            right: { style: 'medium' }, 
            bottom: { style: 'thin' },
            top: { style: 'thin' }
          } as Partial<ExcelJS.Borders>
        };

        // Date Row
        worksheet.getRow(currentRow).height = 30;
        const dateLabel = worksheet.getCell(`A${currentRow}`);
        dateLabel.value = "촬영일시";
        dateLabel.style = labelStyle as any;

        const dateValue = worksheet.getCell(`B${currentRow}`);
        dateValue.value = photo.date;
        dateValue.style = contentStyle as any;
        
        currentRow++;

        // Description Row
        worksheet.getRow(currentRow).height = 60;
        const descLabel = worksheet.getCell(`A${currentRow}`);
        descLabel.value = "촬 영 내 용";
        descLabel.style = labelStyle as any;
        descLabel.border.bottom = { style: 'medium' };

        const descValue = worksheet.getCell(`B${currentRow}`);
        descValue.value = photo.description || "-";
        descValue.style = contentStyle as any;
        descValue.border.bottom = { style: 'medium' };

        currentRow += 2; // Spacer

        // Page break every 2 photos
        if ((i + 1) % 2 === 0 && i !== photos.length - 1) {
          worksheet.getRow(currentRow - 1).addPageBreak();
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const filename = `${projectName || "사진대지"}_${new Date().toISOString().split('T')[0]}.xlsx`;

      const saved = await saveFileWithPicker(blob, filename, { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] });
      
      if (!saved) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
      }
    } catch (err) {
      console.error("Excel Export Error:", err);
      alert("Excel 생성 중 오류가 발생했습니다.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", alignItems: "center", gap: "1rem" }}
        >
          <div className="glass" style={{ padding: "0.75rem", borderRadius: "12px", background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            <Camera size={32} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "800", background: "linear-gradient(to right, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Premium Photo Log
            </h1>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Professional Engineering Solution</p>
          </div>
        </motion.div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={clearAll} className="glass" style={{ padding: "0.75rem 1.25rem", borderRadius: "var(--radius)", color: "var(--destructive)", border: "1px solid rgba(239, 68, 68, 0.2)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Trash2 size={18} /> 전체 삭제
          </button>
          <button 
            disabled={photos.length === 0 || isExportingExcel}
            onClick={exportToExcel} 
            className="glass"
            style={{ padding: "0.75rem 1.25rem", borderRadius: "var(--radius)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            {isExportingExcel ? <span className="animate-spin">⌛</span> : <FileText size={18} />} Excel
          </button>
          <button 
            disabled={photos.length === 0 || isExportingPDF}
            onClick={exportToPDF} 
            className="premium-button"
          >
            {isExportingPDF ? <span className="animate-spin">⌛</span> : <Download size={18} />}
            PDF 내보내기
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: photos.length > 0 ? "1fr 450px" : "1fr", gap: "2rem" }}>
        
        {/* Left Column: Management */}
        <section>
          {photos.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <DropZone onPhotosAdded={addPhotos} />
            </motion.div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div className="glass" style={{ padding: "1.5rem", borderRadius: "var(--radius)" }}>
                <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Settings2 size={18} color="var(--primary)" /> 프로젝트 설정
                </h3>
                <input 
                  type="text" 
                  placeholder="공사명을 입력하세요 (예: 제천영월 1공구 터널공사)" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  style={{ 
                    width: "100%", 
                    background: "rgba(0,0,0,0.2)", 
                    border: "1px solid var(--border)", 
                    padding: "1rem", 
                    borderRadius: "8px", 
                    color: "white",
                    fontSize: "1.1rem",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                <button 
                  onClick={() => setActiveTab("edit")} 
                  className={activeTab === "edit" ? "premium-button" : "glass"}
                  style={{ flex: 1, padding: "1rem", borderRadius: "var(--radius)", cursor: "pointer", border: activeTab === "edit" ? "none" : "1px solid var(--border)", color: activeTab === "edit" ? "white" : "var(--muted-foreground)" }}
                >
                  <Camera size={18} style={{ marginRight: "0.5rem" }} /> 사진 편집
                </button>
                <button 
                  onClick={() => setActiveTab("preview")} 
                  className={activeTab === "preview" ? "premium-button" : "glass"}
                  style={{ flex: 1, padding: "1rem", borderRadius: "var(--radius)", cursor: "pointer", border: activeTab === "preview" ? "none" : "1px solid var(--border)", color: activeTab === "preview" ? "white" : "var(--muted-foreground)" }}
                >
                  <Layout size={18} style={{ marginRight: "0.5rem" }} /> 결과 미리보기
                </button>
              </div>

              {activeTab === "edit" ? (
                <PhotoGrid photos={photos} setPhotos={setPhotos} />
              ) : (
                <PhotoLogTemplate photos={photos} projectName={projectName} />
              )}
              
              <div style={{ marginTop: "2rem" }}>
                <DropZone onPhotosAdded={addPhotos} />
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Mini Info / Guidelines (Only if photos exist) */}
        {photos.length > 0 && (
          <aside style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="glass" style={{ padding: "1.5rem", borderRadius: "var(--radius)" }}>
              <h3 style={{ marginBottom: "1rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={18} /> 일괄 내용 입력
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <textarea 
                  placeholder="모든 사진에 공통으로 적용할 내용을 입력하세요..."
                  value={bulkDescription}
                  onChange={(e) => setBulkDescription(e.target.value)}
                  style={{ 
                    width: "100%", 
                    minHeight: "100px",
                    background: "rgba(0,0,0,0.2)", 
                    border: "1px solid var(--border)", 
                    padding: "0.75rem", 
                    borderRadius: "8px", 
                    color: "white",
                    fontSize: "0.95rem",
                    resize: "vertical",
                    outline: "none"
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <button 
                    onClick={() => applyBulkDescription(false)}
                    className="premium-button"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    전체 일괄 적용
                  </button>
                  <button 
                    onClick={() => applyBulkDescription(true)}
                    className="glass"
                    style={{ width: "100%", padding: "0.5rem", fontSize: "0.8rem", cursor: "pointer", color: "var(--muted-foreground)" }}
                  >
                    빈 칸만 채우기
                  </button>
                </div>
              </div>
            </div>

            <div className="glass" style={{ padding: "1.5rem", borderRadius: "var(--radius)" }}>
              <h3 style={{ marginBottom: "1rem", color: "var(--primary)" }}>📊 통계 및 정보</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted-foreground)" }}>총 사진 수</span>
                  <span>{photos.length} 장</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted-foreground)" }}>예상 페이지</span>
                  <span>{Math.ceil(photos.length / 2)} Page</span>
                </div>
              </div>
            </div>

            <div className="glass" style={{ padding: "1.5rem", borderRadius: "var(--radius)", background: "rgba(99, 102, 241, 0.05)" }}>
              <h3 style={{ marginBottom: "1rem", color: "var(--accent)" }}>💡 팁</h3>
              <ul style={{ paddingLeft: "1.2rem", fontSize: "0.875rem", color: "var(--muted-foreground)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li>사진을 드래그하여 순서를 바꿀 수 있습니다.</li>
                <li>EXIF 정보가 있는 경우 촬영 일시가 자동 입력됩니다.</li>
                <li>'날짜별 정렬' 버튼을 눌러 연대순으로 정리하세요.</li>
                <li>PDF 내보내기 시 A4 규격으로 자동 최적화됩니다.</li>
              </ul>
            </div>
          </aside>
        )}
      </div>

      <style jsx global>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
