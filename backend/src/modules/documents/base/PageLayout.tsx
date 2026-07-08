import React from 'react';
import { Document, Page, View, StyleSheet } from '@react-pdf/renderer';
import { sp } from './styles';

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    paddingTop: 0,           // el header maneja su propio padding
    paddingBottom: sp.xxl + sp.xl, // espacio para el footer fijo
    paddingHorizontal: sp.xxl,
  },
  body: {
    flex: 1,
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
