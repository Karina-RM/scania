import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '@/theme';

export interface DonutSlice {
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  children?: ReactNode; // conteúdo exibido no centro
}

// Gráfico de rosca desenhado à mão com react-native-svg (sem biblioteca de gráficos).
export function DonutChart({
  data,
  size = 190,
  strokeWidth = 28,
  children,
}: DonutChartProps) {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  let consumed = 0;
  const arcs = data.map((slice) => {
    const length = total > 0 ? (slice.value / total) * circumference : 0;
    const arc = { ...slice, length, offset: consumed };
    consumed += length;
    return arc;
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {arcs.map((arc, index) => (
            <Circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              stroke={arc.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
            />
          ))}
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
