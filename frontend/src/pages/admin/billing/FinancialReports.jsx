import React, { useEffect, useState } from 'react';
import { getFinancialByGroomer, getFinancialByService, getFinancialSummary } from '../../../api/commissions';
import { useToast } from '../../../components/Context/ToastContext';
import ExportReportButtons from '../../../components/Common/ExportReportButtons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from 'docx';

export default function FinancialReports() {
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [byGroomer, setByGroomer] = useState([]);
  const [byService, setByService] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      const [s, g, svc] = await Promise.all([getFinancialSummary(), getFinancialByGroomer(), getFinancialByService().catch(() => ({ items: [] }))]);
      setSummary(s);
      setByGroomer(g.items || []);
      setByService(svc.items || []);
    } catch (e) {
      showError(e.message || 'Error cargando reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Hoja de resumen
      if (summary) {
        const summaryData = [
          ['Métrica', 'Valor'],
          ['Total facturado', summary.total_facturado],
          ['Total pagado', summary.total_pagado],
          ['Total pendiente', summary.total_pendiente],
          ['Total cancelado', summary.total_cancelado],
          ['Ingreso plataforma (pagado)', summary.ingreso_plataforma],
          ['Ingreso groomers (pagado)', summary.ingreso_groomers]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');
      }

      // Hoja de ingresos por groomer
      if (byGroomer.length > 0) {
        const groomerData = [
          ['Groomer', 'Total facturado', 'Total pagado', 'Ingreso estimado'],
          ...byGroomer.map(g => [
            g.groomer_email,
            g.total_facturado,
            g.total_pagado,
            g.ingreso_estimado
          ])
        ];
        const wsGroomer = XLSX.utils.aoa_to_sheet(groomerData);
        XLSX.utils.book_append_sheet(wb, wsGroomer, 'Por Groomer');
      }

      // Hoja de ingresos por servicio
      if (byService.length > 0) {
        const serviceData = [
          ['Servicio', 'Total facturado', 'Total pagado', 'Pendiente', 'Ingreso plataforma', 'Ingreso groomers'],
          ...byService.map(s => [
            s.service_name,
            s.total_facturado,
            s.total_pagado,
            s.total_pendiente,
            s.ingreso_plataforma_pagado,
            s.ingreso_groomers_pagado
          ])
        ];
        const wsService = XLSX.utils.aoa_to_sheet(serviceData);
        XLSX.utils.book_append_sheet(wb, wsService, 'Por Servicio');
      }

      XLSX.writeFile(wb, 'reporte_financiero.xlsx');
    } catch (err) {
      showError('Error al exportar a Excel');
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      let y = 20;

      doc.setFontSize(20);
      doc.text('Reporte Financiero', 20, y);
      y += 15;

      if (summary) {
        doc.setFontSize(14);
        doc.text('Resumen General', 20, y);
        y += 10;
        doc.setFontSize(11);
        doc.text(`Total facturado: $${Number(summary.total_facturado).toFixed(2)}`, 25, y);
        y += 7;
        doc.text(`Total pagado: $${Number(summary.total_pagado).toFixed(2)}`, 25, y);
        y += 7;
        doc.text(`Total pendiente: $${Number(summary.total_pendiente).toFixed(2)}`, 25, y);
        y += 7;
        doc.text(`Total cancelado: $${Number(summary.total_cancelado).toFixed(2)}`, 25, y);
        y += 7;
        doc.text(`Ingreso plataforma: $${Number(summary.ingreso_plataforma).toFixed(2)}`, 25, y);
        y += 7;
        doc.text(`Ingreso groomers: $${Number(summary.ingreso_groomers).toFixed(2)}`, 25, y);
        y += 15;
      }

      if (byGroomer.length > 0) {
        doc.setFontSize(14);
        doc.text('Ingresos por Groomer', 20, y);
        y += 10;
        doc.setFontSize(10);
        byGroomer.forEach(g => {
          doc.text(`${g.groomer_email}: $${Number(g.ingreso_estimado).toFixed(2)}`, 25, y);
          y += 6;
        });
        y += 10;
      }

      if (byService.length > 0) {
        doc.setFontSize(14);
        doc.text('Ingresos por Servicio', 20, y);
        y += 10;
        doc.setFontSize(10);
        byService.forEach(s => {
          doc.text(`${s.service_name}: $${Number(s.ingreso_plataforma_pagado).toFixed(2)} (plataforma) / $${Number(s.ingreso_groomers_pagado).toFixed(2)} (groomers)`, 25, y);
          y += 6;
        });
      }

      doc.save('reporte_financiero.pdf');
    } catch (err) {
      showError('Error al exportar a PDF');
    }
  };

  const handleExportWord = async () => {
    try {
      const children = [];

      // Título
      children.push(
        new Paragraph({
          text: 'Reporte Financiero',
          heading: 'Heading1'
        })
      );

      // Resumen
      if (summary) {
        children.push(
          new Paragraph({
            text: 'Resumen General',
            heading: 'Heading2'
          })
        );
        children.push(new Paragraph({ text: `Total facturado: $${Number(summary.total_facturado).toFixed(2)}` }));
        children.push(new Paragraph({ text: `Total pagado: $${Number(summary.total_pagado).toFixed(2)}` }));
        children.push(new Paragraph({ text: `Total pendiente: $${Number(summary.total_pendiente).toFixed(2)}` }));
        children.push(new Paragraph({ text: `Total cancelado: $${Number(summary.total_cancelado).toFixed(2)}` }));
        children.push(new Paragraph({ text: `Ingreso plataforma: $${Number(summary.ingreso_plataforma).toFixed(2)}` }));
        children.push(new Paragraph({ text: `Ingreso groomers: $${Number(summary.ingreso_groomers).toFixed(2)}` }));
      }

      // Tabla por groomer
      if (byGroomer.length > 0) {
        children.push(
          new Paragraph({
            text: 'Ingresos por Groomer',
            heading: 'Heading2'
          })
        );
        const groomerRows = [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Groomer')] }),
              new TableCell({ children: [new Paragraph('Total facturado')] }),
              new TableCell({ children: [new Paragraph('Total pagado')] }),
              new TableCell({ children: [new Paragraph('Ingreso estimado')] })
            ]
          }),
          ...byGroomer.map(g =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(g.groomer_email)] }),
                new TableCell({ children: [new Paragraph(`$${Number(g.total_facturado).toFixed(2)}`)] }),
                new TableCell({ children: [new Paragraph(`$${Number(g.total_pagado).toFixed(2)}`)] }),
                new TableCell({ children: [new Paragraph(`$${Number(g.ingreso_estimado).toFixed(2)}`)] })
              ]
            })
          )
        ];
        children.push(
          new Table({
            rows: groomerRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          })
        );
      }

      // Tabla por servicio
      if (byService.length > 0) {
        children.push(
          new Paragraph({
            text: 'Ingresos por Servicio',
            heading: 'Heading2'
          })
        );
        const serviceRows = [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Servicio')] }),
              new TableCell({ children: [new Paragraph('Total facturado')] }),
              new TableCell({ children: [new Paragraph('Total pagado')] }),
              new TableCell({ children: [new Paragraph('Pendiente')] }),
              new TableCell({ children: [new Paragraph('Ingreso plataforma')] }),
              new TableCell({ children: [new Paragraph('Ingreso groomers')] })
            ]
          }),
          ...byService.map(s =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(s.service_name)] }),
                new TableCell({ children: [new Paragraph(`$${Number(s.total_facturado).toFixed(2)}`)] }),
                new TableCell({ children: [new Paragraph(`$${Number(s.total_pagado).toFixed(2)}`)] }),
                new TableCell({ children: [new Paragraph(`$${Number(s.total_pendiente).toFixed(2)}`)] }),
                new TableCell({ children: [new Paragraph(`$${Number(s.ingreso_plataforma_pagado).toFixed(2)}`)] }),
                new TableCell({ children: [new Paragraph(`$${Number(s.ingreso_groomers_pagado).toFixed(2)}`)] })
              ]
            })
          )
        ];
        children.push(
          new Table({
            rows: serviceRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          })
        );
      }

      const doc = new Document({
        sections: [{ children }]
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_financiero.docx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showError('Error al exportar a Word');
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ marginTop: 0 }}>Reportes Financieros</h1>
        <ExportReportButtons
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          onExportWord={handleExportWord}
          title="Exportar Reporte"
        />
      </div>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Card title="Total facturado" value={summary.total_facturado} />
          <Card title="Total pagado" value={summary.total_pagado} />
          <Card title="Total pendiente" value={summary.total_pendiente} />
          <Card title="Total cancelado" value={summary.total_cancelado} />
          <Card title="Ingreso plataforma (pagado)" value={summary.ingreso_plataforma} />
          <Card title="Ingreso groomers (pagado)" value={summary.ingreso_groomers} />
        </div>
      )}

      <h2 style={{ marginTop: 18 }}>Ingresos por Groomer</h2>
      <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
              <th style={{ textAlign: 'left', padding: 12 }}>Groomer</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Total facturado</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Total pagado</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Ingreso estimado</th>
            </tr>
          </thead>
          <tbody>
            {byGroomer.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: 12, color: '#666' }}>Sin datos.</td>
              </tr>
            ) : (
              byGroomer.map((g) => (
                <tr key={g.groomer_email} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <td style={{ padding: 12 }}>{g.groomer_email}</td>
                  <td style={{ padding: 12 }}>${Number(g.total_facturado || 0).toFixed(2)}</td>
                  <td style={{ padding: 12 }}>${Number(g.total_pagado || 0).toFixed(2)}</td>
                  <td style={{ padding: 12, fontWeight: 900 }}>${Number(g.ingreso_estimado || 0).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 18 }}>Ingresos por Servicio</h2>
      <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
              <th style={{ textAlign: 'left', padding: 12 }}>Servicio</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Total facturado</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Total pagado</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Pendiente</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Ingreso plataforma (pagado)</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Ingreso groomers (pagado)</th>
            </tr>
          </thead>
          <tbody>
            {byService.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: 12, color: '#666' }}>Sin datos.</td>
              </tr>
            ) : (
              byService.map((s) => (
                <tr key={s.service_name} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <td style={{ padding: 12 }}>{s.service_name}</td>
                  <td style={{ padding: 12 }}>${Number(s.total_facturado || 0).toFixed(2)}</td>
                  <td style={{ padding: 12 }}>${Number(s.total_pagado || 0).toFixed(2)}</td>
                  <td style={{ padding: 12 }}>${Number(s.total_pendiente || 0).toFixed(2)}</td>
                  <td style={{ padding: 12, fontWeight: 900 }}>${Number(s.ingreso_plataforma_pagado || 0).toFixed(2)}</td>
                  <td style={{ padding: 12, fontWeight: 900 }}>${Number(s.ingreso_groomers_pagado || 0).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, padding: 14 }}>
      <div style={{ color: '#666' }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>${Number(value || 0).toFixed(2)}</div>
    </div>
  );
}
