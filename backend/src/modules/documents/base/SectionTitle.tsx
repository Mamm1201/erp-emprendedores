import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { palette, sp, fs } from './styles';

const s = StyleSheet.create({
  wrapper: {
    marginBottom: sp.sm,
    marginTop: sp.md,
    paddingBottom: sp.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.brand,
  },
  text: {
    fontSize: fs.sm,
    fontFamily: 'Helvetica-Bold',
    color: palette.dark,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

export function SectionTitle({ children }: { children: string }) {
  return (
    <View style={s.wrapper}>
      <Text style={s.text}>{children}</Text>
    </View>
  );
}
