import React from 'react';

const ExportReportButtons = ({ 
  onExportExcel, 
  onExportPDF, 
  onExportWord, 
  title = "Exportar Informe" 
}) => {
  return (
    <div className="export-section">
      <span className="export-label">{title}:</span>
      <button 
        className="export-btn excel" 
        onClick={onExportExcel}
        disabled={!onExportExcel}
      >
        📊 Excel
      </button>
      <button 
        className="export-btn pdf" 
        onClick={onExportPDF}
        disabled={!onExportPDF}
      >
        📄 PDF
      </button>
      <button 
        className="export-btn word" 
        onClick={onExportWord}
        disabled={!onExportWord}
      >
        📝 Word
      </button>
    </div>
  );
};

export default ExportReportButtons;