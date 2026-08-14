import React from 'react';
import { Document, Page, View, StyleSheet } from '@react-pdf/renderer';
import { sp } from './styles';

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    paddingTop: 0,           // el header maneja su propio padding
    paddingBottom: 0,        // el espacio para el footer va en `body` (ver abajo)
    paddingHorizontal: sp.xxl,
  },
  body: {
    flex: 1,
    // Espacio reservado para el footer fijo (marca + fecha + numero de
    // pagina, ~61pt de contenido propio). El calculo de paginacion
    // automatica de react-pdf no respeta con precision un paddingBottom
    // puesto directamente en `Page` (probado: incluso valores extremos
    // seguian permitiendo overlap con el footer); puesto en el contenedor
    // de flujo (`body`, flex:1) si se respeta de forma confiable. Colchon
    // amplio sobre los ~61pt del footer para dar margen real al calculo.
    paddingBottom: 120,
  },
});

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.body}>{children}</View>
      </Page>
    </Document>
  );
}
